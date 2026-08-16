import type { FateChartExecutionRequest } from '../../application/fate-chart/fate-chart.executor.js'
import { resolveFateChartConventions } from '../../application/fate-chart/resolve-conventions.js'
import type { FateSystem } from '../../domain/fate-system.js'
import type { NormalizedBirth } from '../../domain/normalized-birth.js'
import type { CalculateFateChartArgs, CalculateFateChartResult } from './schemas.js'

export type MapCalculateFateChartRequestResult =
  | { readonly ok: true; readonly request: FateChartExecutionRequest }
  | { readonly ok: false; readonly result: CalculateFateChartResult }

export function mapCalculateFateChartRequest(
  args: CalculateFateChartArgs,
): MapCalculateFateChartRequestResult {
  const requestedSystems = args.systems === undefined ? (['bazi', 'ziwei'] as const) : args.systems

  if (requestedSystems.length === 0 || new Set(requestedSystems).size !== requestedSystems.length) {
    return clarification(
      requestedSystems,
      'INVALID_SYSTEMS',
      'systems',
      '请只选择 bazi、ziwei 或两者，且不要重复。',
    )
  }

  const dateError = validateDate(args.birth)
  if (dateError !== undefined) {
    return clarification(requestedSystems, 'INVALID_DATE', 'birth.date', dateError)
  }

  if (
    args.birth.time.status === 'known' &&
    (!Number.isInteger(args.birth.time.hour) ||
      args.birth.time.hour < 0 ||
      args.birth.time.hour > 23 ||
      !Number.isInteger(args.birth.time.minute) ||
      args.birth.time.minute < 0 ||
      args.birth.time.minute > 59)
  ) {
    return clarification(
      requestedSystems,
      'INVALID_TIME',
      'birth.time',
      '小时必须为 0–23 的整数，分钟必须为 0–59 的整数；不知道时辰时请显式传入 unknown。',
    )
  }

  const locationError = validateLocation(args.birth.location)
  if (locationError !== undefined) {
    return clarification(
      requestedSystems,
      locationError.code,
      locationError.field,
      locationError.repair,
    )
  }

  if (
    args.conventions?.timeMode === 'apparent_solar' &&
    args.birth.location.longitudeDegrees === undefined
  ) {
    return clarification(
      requestedSystems,
      'LONGITUDE_REQUIRED',
      'birth.location.longitudeDegrees',
      '完整视太阳时校准需要出生地点经度；请确认经度后重试。',
    )
  }

  const birth: NormalizedBirth = {
    date:
      args.birth.calendar === 'gregorian'
        ? {
            calendar: 'gregorian',
            year: args.birth.date.year,
            month: args.birth.date.month,
            day: args.birth.date.day,
          }
        : {
            calendar: 'lunar',
            year: args.birth.date.year,
            month: args.birth.date.month,
            day: args.birth.date.day,
            leapMonth: args.birth.date.leapMonth,
          },
    time: args.birth.time,
    gender: args.gender,
    location: {
      timeZone: args.birth.location.timeZone,
      ...(args.birth.location.longitudeDegrees === undefined
        ? {}
        : { longitudeDegrees: args.birth.location.longitudeDegrees }),
      ...(args.birth.location.latitudeDegrees === undefined
        ? {}
        : { latitudeDegrees: args.birth.location.latitudeDegrees }),
      ...(args.birth.location.label === undefined ? {} : { label: args.birth.location.label }),
    },
  }

  return {
    ok: true,
    request: {
      birth,
      systems: [...requestedSystems],
      conventions: resolveFateChartConventions(args.conventions),
    },
  }
}

function clarification(
  requestedSystems: readonly FateSystem[],
  code:
    | 'INVALID_DATE'
    | 'INVALID_TIME'
    | 'INVALID_LOCATION'
    | 'UNSUPPORTED_TIMEZONE'
    | 'INVALID_SYSTEMS'
    | 'LONGITUDE_REQUIRED',
  field: string,
  repair: string,
): MapCalculateFateChartRequestResult {
  return {
    ok: false,
    result: {
      status: 'needs_clarification',
      schemaVersion: '0.1.0-dev.3',
      requestedSystems: [...requestedSystems],
      error: {
        code,
        retryable: true,
        field,
        repair,
      },
    },
  }
}

function validateDate(birth: CalculateFateChartArgs['birth']): string | undefined {
  const { year, month, day } = birth.date
  if (!Number.isInteger(year) || year < 1 || year > 9999) return '年份必须是 1–9999 的整数。'
  if (!Number.isInteger(month) || month < 1 || month > 12) return '月份必须是 1–12 的整数。'

  if (birth.calendar === 'lunar') {
    if (!Number.isInteger(day) || day < 1 || day > 30) return '农历日期必须是 1–30 的整数。'
    return undefined
  }

  const daysInMonth = daysInGregorianMonth(year, month)
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth) {
    return `公历 ${year} 年 ${month} 月没有第 ${day} 日。`
  }
  return undefined
}

function daysInGregorianMonth(year: number, month: number): number {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    return leapYear ? 29 : 28
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function validateLocation(location: CalculateFateChartArgs['birth']['location']):
  | {
      readonly code: 'INVALID_LOCATION' | 'UNSUPPORTED_TIMEZONE'
      readonly field: string
      readonly repair: string
    }
  | undefined {
  if (location.timeZone.trim() === '') {
    return {
      code: 'INVALID_LOCATION',
      field: 'birth.location.timeZone',
      repair: '请提供非空的 IANA 时区，例如 Asia/Shanghai。',
    }
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: location.timeZone }).format(0)
  } catch {
    return {
      code: 'UNSUPPORTED_TIMEZONE',
      field: 'birth.location.timeZone',
      repair: '请改用有效的 IANA 时区，例如 Asia/Shanghai。',
    }
  }

  if (
    location.longitudeDegrees !== undefined &&
    (!Number.isFinite(location.longitudeDegrees) ||
      location.longitudeDegrees < -180 ||
      location.longitudeDegrees > 180)
  ) {
    return {
      code: 'INVALID_LOCATION',
      field: 'birth.location.longitudeDegrees',
      repair: '经度必须在 -180 到 180 之间，东经为正。',
    }
  }

  if (
    location.latitudeDegrees !== undefined &&
    (!Number.isFinite(location.latitudeDegrees) ||
      location.latitudeDegrees < -90 ||
      location.latitudeDegrees > 90)
  ) {
    return {
      code: 'INVALID_LOCATION',
      field: 'birth.location.latitudeDegrees',
      repair: '纬度必须在 -90 到 90 之间，北纬为正。',
    }
  }

  return undefined
}
