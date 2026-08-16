import { describe, expect, it } from 'vitest'

import type { BaziCalculationInput } from '../../../src/capabilities/bazi/bazi.model.js'
import { TymeBaziProvider } from '../../../src/providers/bazi/tyme-bazi.provider.js'

function knownInput(overrides: Partial<BaziCalculationInput> = {}): BaziCalculationInput {
  return {
    birth: {
      date: { calendar: 'gregorian', year: 1992, month: 2, day: 2 },
      time: { status: 'known', hour: 12, minute: 0 },
      gender: 'male',
      location: { timeZone: 'Asia/Shanghai', label: 'Synthetic City' },
    },
    resolvedTime: {
      status: 'known',
      inputTime: { status: 'known', hour: 12, minute: 0 },
      calculationTime: { status: 'known', hour: 12, minute: 0 },
      mode: 'civil',
    },
    conventions: {
      dayBoundary: { value: 'zi_hour_next_day', source: 'default' },
      luckStart: { value: 'lunar_sect_1', source: 'default' },
    },
    ...overrides,
  }
}

describe('TymeBaziProvider', () => {
  it('maps the approved known-time fields without leaking Tyme objects', () => {
    const result = new TymeBaziProvider().calculate(knownInput())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const candidate = result.chart.candidates[0]!
    expect(result.chart).toMatchObject({
      system: 'bazi',
      timePrecision: 'known',
      provenance: { provider: 'tyme4ts', providerVersion: '1.5.2' },
      calendar: {
        solarDate: { year: 1992, month: 2, day: 2 },
        lunarDate: { leapMonth: false, display: '农历辛未年十二月廿九' },
      },
    })
    expect(candidate.dayMaster).toBe('戊')
    expect(candidate.pillars.map(({ ganzhi }) => ganzhi)).toEqual(['辛未', '辛丑', '戊申', '戊午'])
    expect(candidate.pillars[0]?.hiddenStems).toEqual([
      { stem: '己', strength: 'main', tenGod: '劫财' },
      { stem: '丁', strength: 'middle', tenGod: '正印' },
      { stem: '乙', strength: 'residual', tenGod: '正官' },
    ])
    expect(candidate.luck).toMatchObject({
      direction: 'backward',
      start: {
        precision: 'exact',
        startsAt: { year: 2001, month: 2, day: 12, hour: 12, minute: 0 },
      },
    })
    expect(candidate.luck.periods).toHaveLength(8)
    expect(candidate.luck.periods[0]).toEqual({
      index: 1,
      ganzhi: '庚子',
      tenGod: '食神',
      startAge: 10,
      endAge: 19,
      startYear: 2001,
      endYear: 2010,
    })
    expect(JSON.stringify(result.chart)).not.toContain('getEightChar')
  })

  it('enumerates and compresses every minute into conditional unknown-time candidates', () => {
    const input = knownInput({
      birth: {
        date: { calendar: 'gregorian', year: 2000, month: 1, day: 3 },
        time: { status: 'unknown' },
        gender: 'male',
        location: { timeZone: 'Asia/Shanghai', label: 'Synthetic City' },
      },
      resolvedTime: {
        status: 'unknown',
        inputTime: { status: 'unknown' },
        mode: 'civil',
      },
    })

    const result = new TymeBaziProvider().calculate(input)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.chart.timePrecision).toBe('unknown')
    expect(result.chart.candidates.length).toBeGreaterThan(1)
    expect(result.chart.candidates.every(({ pillars }) => pillars.length === 3)).toBe(true)
    expect(result.chart.candidates.flatMap(({ pillars }) => pillars)).not.toContainEqual(
      expect.objectContaining({ role: 'hour' }),
    )
    expect(result.chart.candidates[0]?.possibleBirthTimeRanges[0]?.start).toBe('00:00')
    expect(result.chart.candidates.at(-1)?.possibleBirthTimeRanges.at(-1)?.end).toBe('23:59')
    const coveredMinutes = result.chart.candidates
      .flatMap(({ possibleBirthTimeRanges }) => possibleBirthTimeRanges)
      .reduce((total, range) => total + minuteIndex(range.end) - minuteIndex(range.start) + 1, 0)
    expect(coveredMinutes).toBe(24 * 60)
    expect(new Set(result.chart.candidates.map(({ dayMaster }) => dayMaster)).size).toBeGreaterThan(
      1,
    )
    expect(result.chart.warnings).toContain('CANDIDATES_REQUIRE_CONDITIONAL_INTERPRETATION')
  })

  it('keeps year and month pillar candidates when a solar-term boundary falls inside the day', () => {
    const result = new TymeBaziProvider().calculate(
      knownInput({
        birth: {
          date: { calendar: 'gregorian', year: 2023, month: 2, day: 4 },
          time: { status: 'unknown' },
          gender: 'female',
          location: { timeZone: 'Asia/Shanghai', label: 'Synthetic City' },
        },
        resolvedTime: {
          status: 'unknown',
          inputTime: { status: 'unknown' },
          mode: 'civil',
        },
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const yearMonthPairs = new Set(
      result.chart.candidates.map(({ pillars }) =>
        pillars
          .slice(0, 2)
          .map(({ ganzhi }) => ganzhi)
          .join('/'),
      ),
    )
    expect(yearMonthPairs).toContain('壬寅/癸丑')
    expect(yearMonthPairs).toContain('癸卯/甲寅')
  })

  it('maps an existing leap lunar month and rejects a nonexistent one', () => {
    const leapBirth = {
      date: { calendar: 'lunar' as const, year: 2023, month: 2, day: 1, leapMonth: true },
      time: { status: 'known' as const, hour: 12, minute: 0 },
      gender: 'female' as const,
      location: { timeZone: 'Asia/Shanghai', label: 'Synthetic City' },
    }
    const leapResult = new TymeBaziProvider().calculate(knownInput({ birth: leapBirth }))
    expect(leapResult).toMatchObject({
      ok: true,
      chart: {
        calendar: {
          solarDate: { year: 2023, month: 3, day: 22 },
          lunarDate: { month: 2, day: 1, leapMonth: true },
        },
      },
    })

    const invalidResult = new TymeBaziProvider().calculate(
      knownInput({
        birth: {
          ...leapBirth,
          date: { ...leapBirth.date, year: 2022 },
        },
      }),
    )
    expect(invalidResult).toEqual({
      ok: false,
      error: { code: 'INVALID_LUNAR_DATE', field: 'birth.date' },
    })
  })

  it('isolates day-boundary and luck-start providers between calls', () => {
    const lateZi = knownInput({
      birth: {
        date: { calendar: 'gregorian', year: 2023, month: 1, day: 22 },
        time: { status: 'known', hour: 23, minute: 30 },
        gender: 'male',
        location: { timeZone: 'Asia/Shanghai' },
      },
      resolvedTime: {
        status: 'known',
        inputTime: { status: 'known', hour: 23, minute: 30 },
        calculationTime: { status: 'known', hour: 23, minute: 30 },
        mode: 'civil',
      },
    })
    const provider = new TymeBaziProvider()
    const first = provider.calculate(lateZi)
    const alternate = provider.calculate({
      ...lateZi,
      conventions: {
        dayBoundary: { value: 'late_zi_same_day', source: 'explicit' },
        luckStart: { value: 'lunar_sect_2', source: 'explicit' },
      },
    })
    const restored = provider.calculate(lateZi)

    expect(first).toEqual(restored)
    expect(first).not.toEqual(alternate)
  })
})

function minuteIndex(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number)
  if (hour === undefined || minute === undefined) throw new Error(`Invalid test clock: ${clock}`)
  return hour * 60 + minute
}
