import { astro } from 'iztro'

import type {
  ZiweiCalculationInput,
  ZiweiCalendarAnchor,
  ZiweiChart,
  ZiweiChartCandidate,
  ZiweiPalace,
  ZiweiPalaceId,
  ZiweiStar,
  ZiweiTimeRange,
  ZiweiTransformationId,
} from '../../capabilities/ziwei/ziwei.model.js'
import type { ZiweiProvider, ZiweiProviderResult } from './ziwei.provider.js'

const PROVIDER_VERSION = '2.5.8' as const
const UNKNOWN_TIME_SLOT_COUNT = 13

const PALACE_IDS: Readonly<Record<string, ZiweiPalaceId>> = {
  命宫: 'life',
  兄弟: 'siblings',
  夫妻: 'spouse',
  子女: 'children',
  财帛: 'wealth',
  疾厄: 'health',
  迁移: 'travel',
  仆役: 'friends',
  交友: 'friends',
  官禄: 'career',
  田宅: 'property',
  福德: 'spirit',
  父母: 'parents',
}

const TRANSFORMATION_IDS: Readonly<Record<string, ZiweiTransformationId>> = {
  禄: 'lu',
  权: 'quan',
  科: 'ke',
  忌: 'ji',
}

type IztroChart = ReturnType<typeof astro.withOptions>
type IztroPalace = IztroChart['palaces'][number]
type IztroStar = IztroPalace['majorStars'][number]

class InvalidLunarDateError extends Error {}

/**
 * iztro 防腐层。
 *
 * iztro 的流派、分界和星表配置是进程级可变状态。一次计算必须在
 * 同步临界区内完成，并在 finally 中恢复原配置；调用期间不能 await。
 */
export class IztroZiweiProvider implements ZiweiProvider {
  calculate(input: ZiweiCalculationInput): ZiweiProviderResult {
    const currentConfig = astro.getConfig()
    const originalConfig = {
      yearDivide: currentConfig.yearDivide,
      horoscopeDivide: currentConfig.horoscopeDivide,
      ageDivide: currentConfig.ageDivide,
      dayDivide: currentConfig.dayDivide,
      algorithm: currentConfig.algorithm,
    }

    try {
      const chart =
        input.resolvedTime.status === 'known'
          ? calculateKnownChart(input)
          : calculateUnknownChart(input)

      assertChartInvariants(chart)
      return { ok: true, chart }
    } catch (error) {
      if (error instanceof InvalidLunarDateError) {
        return { ok: false, error: { code: 'INVALID_LUNAR_DATE', field: 'birth.date' } }
      }
      throw error
    } finally {
      astro.config(originalConfig)
    }
  }
}

function calculateKnownChart(input: ZiweiCalculationInput): ZiweiChart {
  if (input.resolvedTime.status !== 'known') throw new TypeError('Expected known calculation time')

  const { hour, minute } = input.resolvedTime.calculationTime
  const timeIndex = timeIndexFromHour(hour)
  const iztroChart = createIztroChart(input, timeIndex)

  return createChart(input, iztroChart, [
    mapCandidate(iztroChart, timeIndex, [
      { start: formatClock(hour, minute), end: formatClock(hour, minute) },
    ]),
  ])
}

function calculateUnknownChart(input: ZiweiCalculationInput): ZiweiChart {
  const charts = Array.from({ length: UNKNOWN_TIME_SLOT_COUNT }, (_, timeIndex) => ({
    timeIndex,
    chart: createIztroChart(input, timeIndex),
  }))
  const candidates = charts.map(({ chart, timeIndex }) =>
    mapCandidate(chart, timeIndex, [timeRangeForIndex(timeIndex)]),
  )

  if (new Set(candidates.map(candidateSignature)).size !== candidates.length) {
    throw new Error('Ziwei unknown-time candidates must be distinct after canonical mapping')
  }

  return createChart(input, charts[0]!.chart, candidates)
}

function createChart(
  input: ZiweiCalculationInput,
  representative: IztroChart,
  candidates: ZiweiChartCandidate[],
): ZiweiChart {
  return {
    system: 'ziwei',
    timePrecision: input.resolvedTime.status,
    calendar: mapCalendarAnchor(input, representative),
    candidates,
    conventions: {
      ...input.conventions,
      dayBoundary: 'zi_hour_next_day',
      yearBoundary: 'lunar_new_year',
      horoscopeBoundary: 'lunar_new_year',
      ageBoundary: 'nominal_year',
    },
    provenance: { provider: 'iztro', providerVersion: PROVIDER_VERSION },
    warnings:
      input.resolvedTime.status === 'unknown'
        ? [
            'BIRTH_TIME_UNKNOWN',
            'THIRTEEN_TIME_SLOT_CANDIDATES',
            'CANDIDATES_REQUIRE_CONDITIONAL_INTERPRETATION',
          ]
        : [],
  }
}

function createIztroChart(input: ZiweiCalculationInput, timeIndex: number): IztroChart {
  const { date } = input.birth

  try {
    const chart = astro.withOptions({
      type: date.calendar === 'gregorian' ? 'solar' : 'lunar',
      dateStr: `${date.year}-${date.month}-${date.day}`,
      timeIndex,
      gender: input.birth.gender === 'male' ? '男' : '女',
      ...(date.calendar === 'lunar' ? { isLeapMonth: date.leapMonth } : {}),
      fixLeap: input.conventions.leapMonthRule.value === 'split_at_day_15',
      language: 'zh-CN',
      config: {
        algorithm: input.conventions.school.value === 'standard' ? 'default' : 'zhongzhou',
        dayDivide: 'forward',
        yearDivide: 'normal',
        horoscopeDivide: 'normal',
        ageDivide: 'normal',
      },
    })

    if (
      date.calendar === 'lunar' &&
      (chart.rawDates.lunarDate.lunarYear !== date.year ||
        chart.rawDates.lunarDate.lunarMonth !== date.month ||
        chart.rawDates.lunarDate.lunarDay !== date.day ||
        chart.rawDates.lunarDate.isLeap !== date.leapMonth)
    ) {
      throw new InvalidLunarDateError()
    }

    return chart
  } catch (error) {
    if (error instanceof InvalidLunarDateError) throw error
    if (date.calendar === 'lunar') throw new InvalidLunarDateError()
    throw error
  }
}

function mapCandidate(
  chart: IztroChart,
  timeIndex: number,
  possibleBirthTimeRanges: ZiweiTimeRange[],
): ZiweiChartCandidate {
  const palaces = chart.palaces.map(mapPalace)
  const lifePalace = palaces.find(({ isLifePalace }) => isLifePalace)
  const bodyPalace = palaces.find(({ isBodyPalace }) => isBodyPalace)
  if (lifePalace === undefined) throw new Error('Ziwei chart is missing the life palace')
  if (bodyPalace === undefined) throw new Error('Ziwei chart is missing the body palace')

  return {
    id: `candidate-${timeIndex + 1}`,
    possibleBirthTimeRanges,
    timeSlot: {
      index: timeIndex,
      name: chart.time,
      range: timeRangeForIndex(timeIndex),
    },
    chineseDate: chart.chineseDate,
    lifePalace: toPalaceAnchor(lifePalace),
    bodyPalace: toPalaceAnchor(bodyPalace),
    soul: chart.soul,
    body: chart.body,
    fiveElementsClass: chart.fiveElementsClass,
    palaces,
  }
}

function toPalaceAnchor(palace: ZiweiPalace): ZiweiChartCandidate['lifePalace'] {
  return {
    palaceId: palace.id,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
  }
}

function mapPalace(palace: IztroPalace): ZiweiPalace {
  const id = PALACE_IDS[palace.name]
  if (id === undefined) throw new Error(`Unsupported Ziwei palace name: ${palace.name}`)
  const stars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map((star) =>
    mapStar(star, id),
  )

  return {
    index: palace.index,
    id,
    name: palace.name,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    isLifePalace: id === 'life',
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    stars,
    decadal: {
      startAge: palace.decadal.range[0],
      endAge: palace.decadal.range[1],
      ganzhi: `${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}`,
    },
  }
}

function mapStar(star: IztroStar, palaceId: ZiweiPalaceId): ZiweiStar {
  const brightness = star.brightness?.trim()
  const transformationName = star.mutagen?.trim()
  const transformationId =
    transformationName === undefined || transformationName === ''
      ? undefined
      : TRANSFORMATION_IDS[transformationName]

  if (
    transformationName !== undefined &&
    transformationName !== '' &&
    transformationId === undefined
  ) {
    throw new Error(`Unsupported Ziwei transformation: ${transformationName}`)
  }

  return {
    id: `star:${palaceId}:${star.type}:${star.name}`,
    name: star.name,
    type: star.type,
    scope: star.scope,
    ...(brightness === undefined || brightness === '' ? {} : { brightness }),
    ...(transformationId === undefined
      ? {}
      : { transformation: { id: transformationId, name: transformationName! } }),
  }
}

function mapCalendarAnchor(input: ZiweiCalculationInput, chart: IztroChart): ZiweiCalendarAnchor {
  const [year, month, day] = chart.solarDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Unexpected iztro solar date: ${chart.solarDate}`)
  }
  const { date } = input.birth

  return {
    input: {
      calendar: date.calendar,
      year: date.year,
      month: date.month,
      day: date.day,
      ...(date.calendar === 'lunar' ? { leapMonth: date.leapMonth } : {}),
    },
    solarDate: { year, month, day },
    lunarDate: {
      year: chart.rawDates.lunarDate.lunarYear,
      month: chart.rawDates.lunarDate.lunarMonth,
      day: chart.rawDates.lunarDate.lunarDay,
      leapMonth: chart.rawDates.lunarDate.isLeap,
      display: chart.lunarDate,
    },
    timeZone: input.birth.location.timeZone,
  }
}

function timeIndexFromHour(hour: number): number {
  return hour === 23 ? 12 : Math.floor((hour + 1) / 2)
}

function timeRangeForIndex(timeIndex: number): ZiweiTimeRange {
  if (timeIndex === 0) return { start: '00:00', end: '01:00' }
  if (timeIndex === 12) return { start: '23:00', end: '24:00' }
  return {
    start: `${String(timeIndex * 2 - 1).padStart(2, '0')}:00`,
    end: `${String(timeIndex * 2 + 1).padStart(2, '0')}:00`,
  }
}

function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function candidateSignature(candidate: ZiweiChartCandidate): string {
  return JSON.stringify({
    chineseDate: candidate.chineseDate,
    lifePalace: candidate.lifePalace,
    bodyPalace: candidate.bodyPalace,
    soul: candidate.soul,
    body: candidate.body,
    fiveElementsClass: candidate.fiveElementsClass,
    palaces: candidate.palaces,
  })
}

function assertChartInvariants(chart: ZiweiChart): void {
  const expectedCandidateCount = chart.timePrecision === 'known' ? 1 : UNKNOWN_TIME_SLOT_COUNT
  if (chart.candidates.length !== expectedCandidateCount) {
    throw new Error(`Expected ${expectedCandidateCount} Ziwei candidates`)
  }

  for (const candidate of chart.candidates) {
    if (candidate.palaces.length !== 12) throw new Error('Ziwei chart must contain 12 palaces')
    if (new Set(candidate.palaces.map(({ id }) => id)).size !== 12) {
      throw new Error('Ziwei palace IDs must be unique')
    }
    if (candidate.palaces.filter(({ isLifePalace }) => isLifePalace).length !== 1) {
      throw new Error('Ziwei chart must contain exactly one life palace')
    }
    if (candidate.palaces.filter(({ isBodyPalace }) => isBodyPalace).length !== 1) {
      throw new Error('Ziwei chart must contain exactly one body palace')
    }
    const starIds = candidate.palaces.flatMap(({ stars }) => stars.map(({ id }) => id))
    if (new Set(starIds).size !== starIds.length) throw new Error('Ziwei star IDs must be unique')
  }
}
