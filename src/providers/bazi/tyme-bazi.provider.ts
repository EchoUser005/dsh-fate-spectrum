import {
  ChildLimit,
  DefaultEightCharProvider,
  Gender,
  type HeavenStem,
  type HideHeavenStemType,
  LunarHour,
  LunarMonth,
  LunarYear,
  LunarSect1ChildLimitProvider,
  LunarSect2ChildLimitProvider,
  LunarSect2EightCharProvider,
  type SixtyCycle,
  type SolarTime,
  SolarTime as TymeSolarTime,
} from 'tyme4ts'

import type {
  BaziCalculationInput,
  BaziCalendarAnchor,
  BaziChart,
  BaziChartCandidate,
  BaziLocalDateTime,
  BaziLuckOffset,
  BaziLuckPeriod,
  BaziPillar,
  BaziPillarRole,
  BaziTimeRange,
} from '../../capabilities/bazi/bazi.model.js'
import type { BaziProvider, BaziProviderResult } from './bazi.provider.js'

const PROVIDER_VERSION = '1.5.2' as const
const PILLAR_ROLES: readonly BaziPillarRole[] = ['year', 'month', 'day', 'hour']
const UNKNOWN_TIME_MINUTES = 24 * 60
const DECADE_COUNT = 8

interface CandidateSnapshot {
  readonly dayMaster: string
  readonly pillars: BaziPillar[]
  readonly direction: 'forward' | 'backward'
  readonly startsAt: BaziLocalDateTime
  readonly offset: BaziLuckOffset
  readonly periods: BaziLuckPeriod[]
}

interface CandidateAccumulator {
  readonly signature: string
  readonly snapshot: CandidateSnapshot
  readonly ranges: Array<{ startMinute: number; endMinute: number }>
  earliest: BaziLocalDateTime
  latest: BaziLocalDateTime
}

/**
 * tyme4ts 防腐层。
 *
 * tyme4ts 通过两个进程级静态字段选择换日与起运算法。整个计算必须在同一个
 * 同步临界区内完成，并在 finally 中恢复原值；调用期间不能 await 或泄漏 Tyme 对象。
 */
export class TymeBaziProvider implements BaziProvider {
  calculate(input: BaziCalculationInput): BaziProviderResult {
    const lunarValidation = validateLunarDate(input)
    if (lunarValidation !== undefined) return lunarValidation

    const originalEightCharProvider = LunarHour.provider
    const originalChildLimitProvider = ChildLimit.provider

    try {
      LunarHour.provider =
        input.conventions.dayBoundary.value === 'zi_hour_next_day'
          ? new DefaultEightCharProvider()
          : new LunarSect2EightCharProvider()
      ChildLimit.provider =
        input.conventions.luckStart.value === 'lunar_sect_1'
          ? new LunarSect1ChildLimitProvider()
          : new LunarSect2ChildLimitProvider()

      const chart =
        input.resolvedTime.status === 'known'
          ? calculateKnownChart(input)
          : calculateUnknownChart(input)

      assertChartInvariants(chart)
      return { ok: true, chart }
    } finally {
      LunarHour.provider = originalEightCharProvider
      ChildLimit.provider = originalChildLimitProvider
    }
  }
}

function calculateKnownChart(input: BaziCalculationInput): BaziChart {
  if (input.resolvedTime.status !== 'known') throw new TypeError('Expected known calculation time')

  const { hour, minute } = input.resolvedTime.calculationTime
  const solarTime = createSolarTime(input, hour, minute)
  const snapshot = calculateSnapshot(solarTime, input, true)

  return {
    system: 'bazi',
    timePrecision: 'known',
    calendar: mapCalendarAnchor(input, solarTime),
    candidates: [
      {
        id: 'candidate-1',
        possibleBirthTimeRanges: [
          { start: formatClock(hour, minute), end: formatClock(hour, minute) },
        ],
        dayMaster: snapshot.dayMaster,
        pillars: snapshot.pillars,
        luck: {
          direction: snapshot.direction,
          start: {
            precision: 'exact',
            startsAt: snapshot.startsAt,
            offset: snapshot.offset,
          },
          periods: snapshot.periods,
        },
      },
    ],
    conventions: input.conventions,
    provenance: { provider: 'tyme4ts', providerVersion: PROVIDER_VERSION },
    warnings: [],
  }
}

function calculateUnknownChart(input: BaziCalculationInput): BaziChart {
  const candidates = new Map<string, CandidateAccumulator>()
  let representativeSolarTime: SolarTime | undefined

  for (let minuteOfDay = 0; minuteOfDay < UNKNOWN_TIME_MINUTES; minuteOfDay += 1) {
    const hour = Math.floor(minuteOfDay / 60)
    const minute = minuteOfDay % 60
    const solarTime = createSolarTime(input, hour, minute)
    representativeSolarTime ??= solarTime
    const snapshot = calculateSnapshot(solarTime, input, false)
    const signature = candidateSignature(snapshot)
    const existing = candidates.get(signature)

    if (existing === undefined) {
      candidates.set(signature, {
        signature,
        snapshot,
        ranges: [{ startMinute: minuteOfDay, endMinute: minuteOfDay }],
        earliest: snapshot.startsAt,
        latest: snapshot.startsAt,
      })
      continue
    }

    const lastRange = existing.ranges.at(-1)
    if (lastRange === undefined) throw new Error('Bazi candidate range invariant failed')
    if (lastRange.endMinute === minuteOfDay - 1) {
      lastRange.endMinute = minuteOfDay
    } else {
      existing.ranges.push({ startMinute: minuteOfDay, endMinute: minuteOfDay })
    }
    if (compareDateTime(snapshot.startsAt, existing.earliest) < 0)
      existing.earliest = snapshot.startsAt
    if (compareDateTime(snapshot.startsAt, existing.latest) > 0) existing.latest = snapshot.startsAt
  }

  if (representativeSolarTime === undefined) throw new Error('No unknown-time samples generated')

  const mappedCandidates: BaziChartCandidate[] = [...candidates.values()].map(
    (candidate, index) => ({
      id: `candidate-${index + 1}`,
      possibleBirthTimeRanges: candidate.ranges.map(mapMinuteRange),
      dayMaster: candidate.snapshot.dayMaster,
      pillars: candidate.snapshot.pillars,
      luck: {
        direction: candidate.snapshot.direction,
        start: {
          precision: 'range',
          earliest: candidate.earliest,
          latest: candidate.latest,
        },
        periods: candidate.snapshot.periods,
      },
    }),
  )

  return {
    system: 'bazi',
    timePrecision: 'unknown',
    calendar: mapCalendarAnchor(input, representativeSolarTime),
    candidates: mappedCandidates,
    conventions: input.conventions,
    provenance: { provider: 'tyme4ts', providerVersion: PROVIDER_VERSION },
    warnings: [
      'BIRTH_TIME_UNKNOWN',
      'HOUR_PILLAR_OMITTED',
      'CANDIDATES_REQUIRE_CONDITIONAL_INTERPRETATION',
    ],
  }
}

function calculateSnapshot(
  solarTime: SolarTime,
  input: BaziCalculationInput,
  includeHour: boolean,
): CandidateSnapshot {
  const eightChar = solarTime.getLunarHour().getEightChar()
  const dayMaster = eightChar.getDay().getHeavenStem()
  const pillars = [
    eightChar.getYear(),
    eightChar.getMonth(),
    eightChar.getDay(),
    eightChar.getHour(),
  ]
  const pillarCount = includeHour ? 4 : 3
  const childLimit = ChildLimit.fromSolarTime(solarTime, toTymeGender(input.birth.gender))

  return {
    dayMaster: dayMaster.getName(),
    pillars: pillars
      .slice(0, pillarCount)
      .map((pillar, index) => mapPillar(PILLAR_ROLES[index]!, pillar, dayMaster)),
    direction: childLimit.isForward() ? 'forward' : 'backward',
    startsAt: mapLocalDateTime(childLimit.getEndTime()),
    offset: {
      years: childLimit.getYearCount(),
      months: childLimit.getMonthCount(),
      days: childLimit.getDayCount(),
      hours: childLimit.getHourCount(),
      minutes: childLimit.getMinuteCount(),
    },
    periods: mapLuckPeriods(childLimit.getStartDecadeFortune(), dayMaster),
  }
}

function mapPillar(role: BaziPillarRole, pillar: SixtyCycle, dayMaster: HeavenStem): BaziPillar {
  const stem = pillar.getHeavenStem()
  const branch = pillar.getEarthBranch()
  const xunkong = pillar.getExtraEarthBranches().map((item) => item.getName())
  if (xunkong.length !== 2) throw new Error(`Expected two xunkong branches for ${pillar.getName()}`)

  return {
    role,
    ganzhi: pillar.getName(),
    stem: stem.getName(),
    branch: branch.getName(),
    stemTenGod: dayMaster.getTenStar(stem).getName(),
    hiddenStems: branch.getHideHeavenStems().map((hidden) => ({
      stem: hidden.getHeavenStem().getName(),
      strength: mapHiddenStemStrength(hidden.getType()),
      tenGod: dayMaster.getTenStar(hidden.getHeavenStem()).getName(),
    })),
    nayin: pillar.getSound().getName(),
    xunkong: [xunkong[0]!, xunkong[1]!],
    dayMasterGrowthStage: dayMaster.getTerrain(branch).getName(),
    selfGrowthStage: stem.getTerrain(branch).getName(),
  }
}

function mapLuckPeriods(
  firstDecade: ReturnType<ReturnType<typeof ChildLimit.fromSolarTime>['getStartDecadeFortune']>,
  dayMaster: HeavenStem,
): BaziLuckPeriod[] {
  const periods: BaziLuckPeriod[] = []
  let decade = firstDecade

  for (let index = 0; index < DECADE_COUNT; index += 1) {
    periods.push({
      index: index + 1,
      ganzhi: decade.getName(),
      tenGod: dayMaster.getTenStar(decade.getSixtyCycle().getHeavenStem()).getName(),
      startAge: decade.getStartAge(),
      endAge: decade.getEndAge(),
      startYear: decade.getStartSixtyCycleYear().getYear(),
      endYear: decade.getEndSixtyCycleYear().getYear(),
    })
    decade = decade.next(1)
  }

  return periods
}

function createSolarTime(input: BaziCalculationInput, hour: number, minute: number): SolarTime {
  const { date } = input.birth
  if (date.calendar === 'gregorian') {
    return TymeSolarTime.fromYmdHms(date.year, date.month, date.day, hour, minute, 0)
  }

  const tymeMonth = date.leapMonth ? -date.month : date.month
  return LunarHour.fromYmdHms(date.year, tymeMonth, date.day, hour, minute, 0).getSolarTime()
}

function validateLunarDate(input: BaziCalculationInput): BaziProviderResult | undefined {
  const { date } = input.birth
  if (date.calendar !== 'lunar') return undefined

  if (date.leapMonth && LunarYear.fromYear(date.year).getLeapMonth() !== date.month) {
    return { ok: false, error: { code: 'INVALID_LUNAR_DATE', field: 'birth.date' } }
  }

  const month = LunarMonth.fromYm(date.year, date.leapMonth ? -date.month : date.month)
  if (date.day > month.getDayCount()) {
    return { ok: false, error: { code: 'INVALID_LUNAR_DATE', field: 'birth.date' } }
  }

  return undefined
}

function mapCalendarAnchor(input: BaziCalculationInput, solarTime: SolarTime): BaziCalendarAnchor {
  const lunarDay = solarTime.getLunarHour().getLunarDay()
  const lunarMonth = lunarDay.getLunarMonth()
  const { date } = input.birth

  return {
    input: {
      calendar: date.calendar,
      year: date.year,
      month: date.month,
      day: date.day,
      ...(date.calendar === 'lunar' ? { leapMonth: date.leapMonth } : {}),
    },
    solarDate: {
      year: solarTime.getYear(),
      month: solarTime.getMonth(),
      day: solarTime.getDay(),
    },
    lunarDate: {
      year: lunarDay.getYear(),
      month: lunarMonth.getMonth(),
      day: lunarDay.getDay(),
      leapMonth: lunarMonth.isLeap(),
      display: lunarDay.toString(),
    },
    timeZone: input.birth.location.timeZone,
  }
}

function mapLocalDateTime(value: SolarTime): BaziLocalDateTime {
  return {
    year: value.getYear(),
    month: value.getMonth(),
    day: value.getDay(),
    hour: value.getHour(),
    minute: value.getMinute(),
    second: value.getSecond(),
  }
}

function mapHiddenStemStrength(type: HideHeavenStemType): 'main' | 'middle' | 'residual' {
  if (type === 2) return 'main'
  if (type === 1) return 'middle'
  if (type === 0) return 'residual'
  throw new Error(`Unknown hidden-stem type: ${String(type)}`)
}

function toTymeGender(gender: 'male' | 'female'): Gender {
  return gender === 'male' ? Gender.MAN : Gender.WOMAN
}

function candidateSignature(snapshot: CandidateSnapshot): string {
  return JSON.stringify({
    dayMaster: snapshot.dayMaster,
    pillars: snapshot.pillars,
    direction: snapshot.direction,
    periods: snapshot.periods,
  })
}

function mapMinuteRange(range: { startMinute: number; endMinute: number }): BaziTimeRange {
  return {
    start: formatClock(Math.floor(range.startMinute / 60), range.startMinute % 60),
    end: formatClock(Math.floor(range.endMinute / 60), range.endMinute % 60),
  }
}

function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function compareDateTime(left: BaziLocalDateTime, right: BaziLocalDateTime): number {
  const leftParts = [left.year, left.month, left.day, left.hour, left.minute, left.second]
  const rightParts = [right.year, right.month, right.day, right.hour, right.minute, right.second]
  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!
    if (difference !== 0) return difference
  }
  return 0
}

function assertChartInvariants(chart: BaziChart): void {
  if (chart.candidates.length === 0)
    throw new Error('Bazi chart must contain at least one candidate')

  const expectedPillarCount = chart.timePrecision === 'known' ? 4 : 3
  for (const candidate of chart.candidates) {
    if (candidate.pillars.length !== expectedPillarCount) {
      throw new Error(
        `Expected ${expectedPillarCount} pillars for ${chart.timePrecision} birth time`,
      )
    }
    if (candidate.pillars.some((pillar) => pillar.hiddenStems.length === 0)) {
      throw new Error('Every Bazi pillar must contain at least one hidden stem')
    }
    if (candidate.luck.periods.length !== DECADE_COUNT) {
      throw new Error(`Expected ${DECADE_COUNT} decade-fortune periods`)
    }
  }
}
