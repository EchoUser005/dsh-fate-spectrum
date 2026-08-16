import { astro } from 'iztro'
import { describe, expect, it } from 'vitest'

import type { ZiweiCalculationInput } from '../../../src/capabilities/ziwei/ziwei.model.js'
import { IztroZiweiProvider } from '../../../src/providers/ziwei/iztro-ziwei.provider.js'

function createInput(overrides: Partial<ZiweiCalculationInput> = {}): ZiweiCalculationInput {
  return {
    birth: {
      date: { calendar: 'gregorian', year: 2000, month: 8, day: 16 },
      time: { status: 'known', hour: 3, minute: 30 },
      gender: 'male',
      location: { timeZone: 'Asia/Shanghai', label: 'Synthetic City' },
    },
    resolvedTime: {
      status: 'known',
      inputTime: { status: 'known', hour: 3, minute: 30 },
      calculationTime: { status: 'known', hour: 3, minute: 30 },
      mode: 'civil',
    },
    conventions: {
      school: { value: 'standard', source: 'default' },
      leapMonthRule: { value: 'split_at_day_15', source: 'default' },
    },
    ...overrides,
  }
}

function scalarConfig() {
  const config = astro.getConfig()
  return {
    yearDivide: config.yearDivide,
    horoscopeDivide: config.horoscopeDivide,
    ageDivide: config.ageDivide,
    dayDivide: config.dayDivide,
    algorithm: config.algorithm,
  }
}

describe('IztroZiweiProvider', () => {
  it('maps a known-time chart without leaking iztro objects', () => {
    const result = new IztroZiweiProvider().calculate(createInput())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.chart).toMatchObject({
      system: 'ziwei',
      timePrecision: 'known',
      calendar: {
        solarDate: { year: 2000, month: 8, day: 16 },
        lunarDate: { year: 2000, month: 7, day: 17, leapMonth: false },
      },
      provenance: { provider: 'iztro', providerVersion: '2.5.8' },
      candidates: [
        {
          timeSlot: { index: 2, name: '寅时', range: { start: '03:00', end: '05:00' } },
          soul: '破军',
          body: '文昌',
          fiveElementsClass: '木三局',
        },
      ],
    })
    const candidate = result.chart.candidates[0]!
    expect(candidate.palaces).toHaveLength(12)
    expect(candidate.palaces.filter(({ isLifePalace }) => isLifePalace)).toHaveLength(1)
    expect(candidate.palaces.filter(({ isBodyPalace }) => isBodyPalace)).toHaveLength(1)
    expect(candidate.palaces.flatMap(({ stars }) => stars)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringContaining('star:'),
          name: '武曲',
          transformation: { id: 'quan', name: '权' },
        }),
      ]),
    )
    expect(JSON.stringify(result.chart)).not.toContain('plugins')
    expect(JSON.stringify(result.chart)).not.toContain('rawDates')
  })

  it('returns thirteen complete candidates for unknown time', () => {
    const base = createInput()
    const result = new IztroZiweiProvider().calculate({
      ...base,
      birth: { ...base.birth, time: { status: 'unknown' } },
      resolvedTime: {
        status: 'unknown',
        inputTime: { status: 'unknown' },
        mode: 'civil',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.chart.timePrecision).toBe('unknown')
    expect(result.chart.candidates).toHaveLength(13)
    expect(result.chart.candidates[0]?.timeSlot).toMatchObject({
      index: 0,
      name: '早子时',
      range: { start: '00:00', end: '01:00' },
    })
    expect(result.chart.candidates[12]?.timeSlot).toMatchObject({
      index: 12,
      name: '晚子时',
      range: { start: '23:00', end: '24:00' },
    })
    expect(result.chart.candidates.every(({ palaces }) => palaces.length === 12)).toBe(true)
    expect(
      new Set(result.chart.candidates.map((candidate) => JSON.stringify(candidate))).size,
    ).toBe(13)
  })

  it('applies explicit school and leap-month rules and restores global config', () => {
    const provider = new IztroZiweiProvider()
    const original = scalarConfig()
    const standard = provider.calculate(createInput())
    const zhongzhou = provider.calculate(
      createInput({
        conventions: {
          school: { value: 'zhongzhou', source: 'explicit' },
          leapMonthRule: { value: 'split_at_day_15', source: 'default' },
        },
      }),
    )
    const restored = provider.calculate(createInput())

    expect(standard.ok && zhongzhou.ok && restored.ok).toBe(true)
    if (!standard.ok || !zhongzhou.ok || !restored.ok) return
    expect(standard.chart.candidates[0]?.soul).toBe('破军')
    expect(zhongzhou.chart.candidates[0]?.soul).toBe('廉贞')
    expect(restored.chart).toEqual(standard.chart)
    expect(scalarConfig()).toEqual(original)
  })

  it('makes the approved leap-month rule difference explicit', () => {
    const base = createInput()
    const lunarBirth = {
      ...base.birth,
      date: { calendar: 'lunar' as const, year: 2023, month: 2, day: 20, leapMonth: true },
      gender: 'female' as const,
    }
    const split = new IztroZiweiProvider().calculate({ ...base, birth: lunarBirth })
    const whole = new IztroZiweiProvider().calculate({
      ...base,
      birth: lunarBirth,
      conventions: {
        school: { value: 'standard', source: 'default' },
        leapMonthRule: { value: 'whole_leap_month', source: 'explicit' },
      },
    })

    expect(split.ok && whole.ok).toBe(true)
    if (!split.ok || !whole.ok) return
    expect(split.chart.candidates[0]?.fiveElementsClass).toBe('水二局')
    expect(whole.chart.candidates[0]?.fiveElementsClass).toBe('金四局')
    expect(split.chart.candidates[0]?.lifePalace.earthlyBranch).not.toBe(
      whole.chart.candidates[0]?.lifePalace.earthlyBranch,
    )
  })

  it('classifies a nonexistent leap month as repairable input', () => {
    const base = createInput()
    const result = new IztroZiweiProvider().calculate({
      ...base,
      birth: {
        ...base.birth,
        date: { calendar: 'lunar', year: 2022, month: 2, day: 1, leapMonth: true },
      },
    })

    expect(result).toEqual({
      ok: false,
      error: { code: 'INVALID_LUNAR_DATE', field: 'birth.date' },
    })
  })
})
