export type PublicTimeMode = 'civil' | 'apparent_solar'

export type TimeCorrectionMode = 'civil' | 'apparent'

export type BaziDayBoundary = 'zi_hour_next_day' | 'late_zi_same_day'

export type BaziLuckStart = 'lunar_sect_1' | 'lunar_sect_2'

export type ZiweiSchool = 'standard' | 'zhongzhou'

export type ZiweiLeapMonthRule = 'split_at_day_15' | 'whole_leap_month'

export interface ResolvedConvention<T> {
  readonly value: T
  readonly source: 'default' | 'explicit'
}

export interface ResolvedFateChartConventions {
  readonly timeMode: ResolvedConvention<TimeCorrectionMode>
  readonly bazi: {
    readonly dayBoundary: ResolvedConvention<BaziDayBoundary>
    readonly luckStart: ResolvedConvention<BaziLuckStart>
  }
  readonly ziwei: {
    readonly school: ResolvedConvention<ZiweiSchool>
    readonly leapMonthRule: ResolvedConvention<ZiweiLeapMonthRule>
  }
}
