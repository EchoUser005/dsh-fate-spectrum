import type {
  BaziDayBoundary,
  BaziLuckStart,
  PublicTimeMode,
  ResolvedConvention,
  ResolvedFateChartConventions,
  ZiweiLeapMonthRule,
  ZiweiSchool,
} from '../../domain/fate-chart-conventions.js'

export interface FateChartConventionInput {
  readonly timeMode?: PublicTimeMode
  readonly bazi?: {
    readonly dayBoundary?: BaziDayBoundary
    readonly luckStart?: BaziLuckStart
  }
  readonly ziwei?: {
    readonly school?: ZiweiSchool
    readonly leapMonthRule?: ZiweiLeapMonthRule
  }
}

export function resolveFateChartConventions(
  input: FateChartConventionInput | undefined,
): ResolvedFateChartConventions {
  return {
    timeMode: resolveConvention(
      input?.timeMode === 'apparent_solar' ? 'apparent' : 'civil',
      input?.timeMode,
    ),
    bazi: {
      dayBoundary: resolveConvention(
        input?.bazi?.dayBoundary ?? 'zi_hour_next_day',
        input?.bazi?.dayBoundary,
      ),
      luckStart: resolveConvention(
        input?.bazi?.luckStart ?? 'lunar_sect_1',
        input?.bazi?.luckStart,
      ),
    },
    ziwei: {
      school: resolveConvention(input?.ziwei?.school ?? 'standard', input?.ziwei?.school),
      leapMonthRule: resolveConvention(
        input?.ziwei?.leapMonthRule ?? 'split_at_day_15',
        input?.ziwei?.leapMonthRule,
      ),
    },
  }
}

function resolveConvention<T>(value: T, explicitValue: unknown): ResolvedConvention<T> {
  return {
    value,
    source: explicitValue === undefined ? 'default' : 'explicit',
  }
}
