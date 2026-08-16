import { describe, expect, it } from 'vitest'

import type { BaziCalculationEngine } from '../../../src/capabilities/bazi/bazi.engine.js'
import { BaselineTimeEngine } from '../../../src/capabilities/time/baseline-time.engine.js'
import type { TimeCalculationEngine } from '../../../src/capabilities/time/time.engine.js'
import { UnavailableZiweiEngine } from '../../../src/capabilities/ziwei/unavailable-ziwei.engine.js'
import type { ZiweiCalculationEngine } from '../../../src/capabilities/ziwei/ziwei.engine.js'
import {
  FateChartExecutor,
  type FateChartExecutionRequest,
} from '../../../src/application/fate-chart/fate-chart.executor.js'
import type { CalculationExecutionContext } from '../../../src/domain/execution-context.js'
import type { NormalizedBirth } from '../../../src/domain/normalized-birth.js'
import { syntheticBaziChart } from '../../fixtures/synthetic-bazi-chart.js'
import { syntheticZiweiChart } from '../../fixtures/synthetic-ziwei-chart.js'

const syntheticBirth: NormalizedBirth = {
  date: {
    calendar: 'gregorian',
    year: 2000,
    month: 1,
    day: 2,
  },
  time: {
    status: 'unknown',
  },
  gender: 'female',
  location: {
    timeZone: 'Asia/Shanghai',
    label: 'Synthetic City',
  },
}

class RecordingBaziEngine implements BaziCalculationEngine {
  readonly calls: CalculationExecutionContext[] = []

  async calculate(
    _input: { readonly birth: NormalizedBirth },
    context: CalculationExecutionContext,
  ) {
    this.calls.push(context)
    return {
      ok: true as const,
      value: syntheticBaziChart,
      warnings: [],
    }
  }
}

class RecordingZiweiEngine implements ZiweiCalculationEngine {
  readonly calls: CalculationExecutionContext[] = []

  async calculate(
    _input: { readonly birth: NormalizedBirth },
    context: CalculationExecutionContext,
  ) {
    this.calls.push(context)
    return {
      ok: true as const,
      value: syntheticZiweiChart,
      warnings: [],
    }
  }
}

function createContext(): CalculationExecutionContext {
  return { signal: new AbortController().signal }
}

function createRequest(systems: FateChartExecutionRequest['systems']): FateChartExecutionRequest {
  return {
    birth: syntheticBirth,
    systems,
    conventions: {
      timeMode: { value: 'civil', source: 'default' },
      bazi: {
        dayBoundary: { value: 'zi_hour_next_day', source: 'default' },
        luckStart: { value: 'lunar_sect_1', source: 'default' },
      },
      ziwei: {
        school: { value: 'standard', source: 'default' },
        leapMonthRule: { value: 'split_at_day_15', source: 'default' },
      },
    },
  }
}

function createDependencies(
  bazi: BaziCalculationEngine,
  ziwei: ZiweiCalculationEngine,
  time: TimeCalculationEngine = new BaselineTimeEngine(),
) {
  return { time, bazi, ziwei }
}

describe('FateChartExecutor', () => {
  it('calls only the Bazi engine for an explicit Bazi request', async () => {
    const bazi = new RecordingBaziEngine()
    const ziwei = new RecordingZiweiEngine()
    const context = createContext()
    const executor = new FateChartExecutor(createDependencies(bazi, ziwei))

    const result = await executor.execute(createRequest(['bazi']), context)

    expect(bazi.calls).toEqual([context])
    expect(ziwei.calls).toEqual([])
    expect(result).toEqual({
      requestedSystems: ['bazi'],
      timeOutcome: {
        ok: true,
        value: {
          status: 'unknown',
          inputTime: { status: 'unknown' },
          mode: 'civil',
        },
        warnings: [],
      },
      systemOutcomes: [
        {
          system: 'bazi',
          outcome: {
            ok: true,
            value: syntheticBaziChart,
            warnings: [],
          },
        },
      ],
    })
  })

  it('keeps Bazi success separate from the unavailable Ziwei outcome', async () => {
    const executor = new FateChartExecutor(
      createDependencies(new RecordingBaziEngine(), new UnavailableZiweiEngine()),
    )

    const result = await executor.execute(createRequest(['bazi', 'ziwei']), createContext())

    expect(result.systemOutcomes).toEqual([
      {
        system: 'bazi',
        outcome: {
          ok: true,
          value: syntheticBaziChart,
          warnings: [],
        },
      },
      {
        system: 'ziwei',
        outcome: {
          ok: false,
          error: {
            code: 'ZIWEI_NOT_IMPLEMENTED',
            category: 'unsupported',
          },
        },
      },
    ])
  })

  it('rejects an empty or duplicate internal routing request', async () => {
    const executor = new FateChartExecutor(
      createDependencies(new RecordingBaziEngine(), new RecordingZiweiEngine()),
    )
    const context = createContext()

    await expect(executor.execute(createRequest([]), context)).rejects.toThrow(
      'FateChartExecutionRequest.systems must not be empty',
    )
    await expect(executor.execute(createRequest(['bazi', 'bazi']), context)).rejects.toThrow(
      'FateChartExecutionRequest.systems must not contain duplicates',
    )
  })

  it('honors cancellation before starting an engine', async () => {
    const bazi = new RecordingBaziEngine()
    const ziwei = new RecordingZiweiEngine()
    const controller = new AbortController()
    const executor = new FateChartExecutor(createDependencies(bazi, ziwei))
    controller.abort(new Error('cancelled by test'))

    await expect(
      executor.execute(createRequest(['bazi', 'ziwei']), { signal: controller.signal }),
    ).rejects.toThrow('cancelled by test')
    expect(bazi.calls).toEqual([])
    expect(ziwei.calls).toEqual([])
  })

  it('resolves shared time once and stops before system engines when it is unavailable', async () => {
    const bazi = new RecordingBaziEngine()
    const ziwei = new RecordingZiweiEngine()
    const request = createRequest(['bazi', 'ziwei'])
    const executor = new FateChartExecutor(createDependencies(bazi, ziwei))

    const result = await executor.execute(
      {
        ...request,
        conventions: {
          ...request.conventions,
          timeMode: { value: 'apparent', source: 'explicit' },
        },
      },
      createContext(),
    )

    expect(result.timeOutcome).toEqual({
      ok: false,
      error: {
        code: 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED',
        category: 'unsupported',
        field: 'conventions.timeMode',
      },
    })
    expect(result.systemOutcomes).toEqual([])
    expect(bazi.calls).toEqual([])
    expect(ziwei.calls).toEqual([])
  })
})
