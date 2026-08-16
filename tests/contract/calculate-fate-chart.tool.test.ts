import {
  ToolArgsError,
  validateJsonSchemaValue,
  valueSchemaSpecToJsonSchema,
} from '@deepseek-ai/dsh-tools'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { describe, expect, it } from 'vitest'

import { createCalculateFateChartTool } from '../../src/adapters/dsh/calculate-fate-chart.tool.js'
import { FateChartExecutor } from '../../src/application/fate-chart/fate-chart.executor.js'
import { ProviderBackedBaziEngine } from '../../src/capabilities/bazi/provider-backed-bazi.engine.js'
import { BaselineTimeEngine } from '../../src/capabilities/time/baseline-time.engine.js'
import { ProviderBackedZiweiEngine } from '../../src/capabilities/ziwei/provider-backed-ziwei.engine.js'
import {
  calculateFateChartOutputSchema,
  type CalculateFateChartResult,
} from '../../src/contracts/calculate-fate-chart/schemas.js'
import { TymeBaziProvider } from '../../src/providers/bazi/tyme-bazi.provider.js'
import { IztroZiweiProvider } from '../../src/providers/ziwei/iztro-ziwei.provider.js'

const syntheticArgs = {
  birth: {
    calendar: 'gregorian' as const,
    date: { year: 2000, month: 2, day: 29 },
    time: { status: 'known' as const, hour: 10, minute: 30 },
    location: {
      timeZone: 'Asia/Shanghai',
      label: 'Synthetic City',
    },
  },
  gender: 'male' as const,
}

function createTool() {
  return createCalculateFateChartTool(
    new FateChartExecutor({
      time: new BaselineTimeEngine(),
      bazi: new ProviderBackedBaziEngine(new TymeBaziProvider()),
      ziwei: new ProviderBackedZiweiEngine(new IztroZiweiProvider()),
    }),
  )
}

function createRunContext(): ToolRunContext {
  return {
    callId: 'synthetic-call' as ToolRunContext['callId'],
    rootCallId: 'synthetic-call' as ToolRunContext['rootCallId'],
    name: 'calculate_fate_chart',
    arguments: syntheticArgs,
    signal: new AbortController().signal,
    token: Symbol('synthetic') as ToolRunContext['token'],
    deferContext() {},
    concludeTurn() {},
  }
}

describe('calculate_fate_chart DSH contract', () => {
  it('lets DSH reject missing required model parameters before execution', async () => {
    const tool = createTool()

    await expect(tool.execute({}, createRunContext())).rejects.toBeInstanceOf(ToolArgsError)
  })

  it('defaults systems to both and returns two real canonical charts', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      syntheticArgs,
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'success',
      schemaVersion: '0.1.0',
      requestedSystems: ['bazi', 'ziwei'],
      systems: [
        {
          system: 'bazi',
          status: 'success',
          chart: {
            system: 'bazi',
            timePrecision: 'known',
            provenance: { provider: 'tyme4ts', providerVersion: '1.5.2' },
          },
        },
        {
          system: 'ziwei',
          status: 'success',
          chart: {
            system: 'ziwei',
            timePrecision: 'known',
            provenance: { provider: 'iztro', providerVersion: '2.5.8' },
            candidates: [
              {
                timeSlot: { index: 5, name: '巳时' },
                palaces: expect.any(Array),
              },
            ],
          },
        },
      ],
    })
    expect(
      validateJsonSchemaValue(valueSchemaSpecToJsonSchema(calculateFateChartOutputSchema), result),
    ).toEqual([])
  })

  it('returns success for an explicit Bazi request without inventing Ziwei', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      { ...syntheticArgs, systems: ['bazi'] },
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'success',
      requestedSystems: ['bazi'],
      systems: [{ system: 'bazi', status: 'success' }],
    })
  })

  it('returns success for explicit Ziwei conventions without calling for Bazi output', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      {
        ...syntheticArgs,
        systems: ['ziwei'],
        conventions: {
          ziwei: { school: 'zhongzhou', leapMonthRule: 'whole_leap_month' },
        },
      },
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'success',
      requestedSystems: ['ziwei'],
      systems: [
        {
          system: 'ziwei',
          status: 'success',
          chart: {
            conventions: {
              school: { value: 'zhongzhou', source: 'explicit' },
              leapMonthRule: { value: 'whole_leap_month', source: 'explicit' },
            },
          },
        },
      ],
    })
    expect(
      validateJsonSchemaValue(valueSchemaSpecToJsonSchema(calculateFateChartOutputSchema), result),
    ).toEqual([])
  })

  it('turns missing true-solar longitude into a retryable canonical result', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      {
        ...syntheticArgs,
        conventions: { timeMode: 'apparent_solar' },
      },
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'needs_clarification',
      requestedSystems: ['bazi', 'ziwei'],
      error: {
        code: 'LONGITUDE_REQUIRED',
        retryable: true,
        field: 'birth.location.longitudeDegrees',
      },
    })
  })

  it('returns conditional candidates for unknown time instead of inventing midnight', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      {
        ...syntheticArgs,
        birth: {
          ...syntheticArgs.birth,
          time: { status: 'unknown' },
        },
        systems: ['bazi'],
      },
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'success',
      requestedSystems: ['bazi'],
      systems: [
        {
          system: 'bazi',
          status: 'success',
          chart: { timePrecision: 'unknown' },
        },
      ],
    })
    if (result.status !== 'success') return
    const system = result.systems[0]
    expect(system?.status).toBe('success')
    if (system?.status !== 'success' || system.system !== 'bazi') return
    expect(system.chart.candidates.length).toBeGreaterThan(1)
    expect(system.chart.candidates.every(({ pillars }) => pillars.length === 3)).toBe(true)
    expect(system.chart.candidates.flatMap(({ pillars }) => pillars)).not.toContainEqual(
      expect.objectContaining({ role: 'hour' }),
    )
    expect(
      validateJsonSchemaValue(valueSchemaSpecToJsonSchema(calculateFateChartOutputSchema), result),
    ).toEqual([])
    const rendered = tool.output.render(syntheticArgs, result)
    const observation = rendered[0]?.type === 'text' ? rendered[0].text : ''
    expect(observation).toContain('出生时辰未知')
    expect(observation).toContain('必须分别作条件式解读，不得擅自选择其中一个')
  })

  it('returns thirteen Ziwei candidates for unknown time with a bounded Observation', async () => {
    const tool = createTool()
    const args = {
      ...syntheticArgs,
      birth: { ...syntheticArgs.birth, time: { status: 'unknown' as const } },
      systems: ['ziwei' as const],
    }

    const result = (await tool.execute(args, createRunContext())) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'success',
      requestedSystems: ['ziwei'],
      systems: [
        {
          system: 'ziwei',
          status: 'success',
          chart: { timePrecision: 'unknown' },
        },
      ],
    })
    if (result.status !== 'success') return
    const system = result.systems[0]
    expect(system?.status).toBe('success')
    if (system?.status !== 'success' || system.system !== 'ziwei') return
    expect(system.chart.candidates).toHaveLength(13)
    expect(system.chart.candidates.every(({ palaces }) => palaces.length === 12)).toBe(true)
    expect(
      validateJsonSchemaValue(valueSchemaSpecToJsonSchema(calculateFateChartOutputSchema), result),
    ).toEqual([])

    const rendered = tool.output.render(args, result)
    const observation = rendered[0]?.type === 'text' ? rendered[0].text : ''
    expect(observation).toContain('覆盖全天的 13 份紫微候选盘')
    expect(observation).toContain('不得擅自选定一盘')
    expect(observation.length).toBeLessThan(15_000)
  })

  it('returns a repairable canonical result for an impossible Gregorian date', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      {
        ...syntheticArgs,
        birth: {
          ...syntheticArgs.birth,
          date: { year: 2001, month: 2, day: 29 },
        },
      },
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'needs_clarification',
      error: {
        code: 'INVALID_DATE',
        retryable: true,
        field: 'birth.date',
      },
    })
  })

  it('returns a repairable canonical result for a nonexistent leap lunar month', async () => {
    const tool = createTool()

    const result = (await tool.execute(
      {
        ...syntheticArgs,
        birth: {
          ...syntheticArgs.birth,
          calendar: 'lunar',
          date: { year: 2022, month: 2, day: 1, leapMonth: true },
        },
        systems: ['bazi'],
      },
      createRunContext(),
    )) as CalculateFateChartResult

    expect(result).toMatchObject({
      status: 'needs_clarification',
      error: {
        code: 'INVALID_LUNAR_DATE',
        retryable: true,
        field: 'birth.date',
      },
    })
  })

  it('renders an action-oriented Observation instead of repeating canonical JSON', async () => {
    const tool = createTool()
    const result = (await tool.execute(
      syntheticArgs,
      createRunContext(),
    )) as CalculateFateChartResult

    const rendered = tool.output.render(syntheticArgs, result)
    expect(rendered).toHaveLength(1)
    expect(rendered[0]).toMatchObject({ type: 'text' })
    expect(rendered[0]?.type === 'text' ? rendered[0].text : '').toContain(
      '八字排盘已成功，以下是可用于分析的确定性命盘事实。',
    )
    expect(rendered[0]?.type === 'text' ? rendered[0].text : '').toContain(
      '紫微斗数排盘已成功，以下是可用于分析和命盘渲染的确定性事实。',
    )
    expect(rendered[0]?.type === 'text' ? rendered[0].text : '').toContain('本命四化：')
    expect(rendered[0]?.type === 'text' ? rendered[0].text : '').toMatch(
      /\d{4}–\d{4} 年，\d+–\d+ 周岁/,
    )
    expect(rendered[0]?.type === 'text' ? rendered[0].text : '').not.toContain('"schemaVersion"')
  })
})
