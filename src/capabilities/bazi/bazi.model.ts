import type { NormalizedBirth } from '../../domain/normalized-birth.js'
import type { ResolvedFateChartConventions } from '../../domain/fate-chart-conventions.js'
import type { ResolvedCalculationTimeDraft } from '../time/time.model.js'

export interface BaziCalculationInput {
  readonly birth: NormalizedBirth
  readonly resolvedTime: ResolvedCalculationTimeDraft
  readonly conventions: ResolvedFateChartConventions['bazi']
}

export type BaziPillarRole = 'year' | 'month' | 'day' | 'hour'

export interface BaziHiddenStem {
  readonly stem: string
  readonly strength: 'main' | 'middle' | 'residual'
  readonly tenGod: string
}

export interface BaziPillar {
  readonly role: BaziPillarRole
  readonly ganzhi: string
  readonly stem: string
  readonly branch: string
  readonly stemTenGod: string
  readonly hiddenStems: BaziHiddenStem[]
  readonly nayin: string
  readonly xunkong: string[]
  readonly dayMasterGrowthStage: string
  readonly selfGrowthStage: string
}

export interface BaziLocalDateTime {
  readonly year: number
  readonly month: number
  readonly day: number
  readonly hour: number
  readonly minute: number
  readonly second: number
}

export interface BaziTimeRange {
  readonly start: string
  readonly end: string
}

export interface BaziLuckOffset {
  readonly years: number
  readonly months: number
  readonly days: number
  readonly hours: number
  readonly minutes: number
}

export interface BaziLuckPeriod {
  readonly index: number
  readonly ganzhi: string
  readonly tenGod: string
  readonly startAge: number
  readonly endAge: number
  readonly startYear: number
  readonly endYear: number
}

export type BaziLuckStart =
  | {
      readonly precision: 'exact'
      readonly startsAt: BaziLocalDateTime
      readonly offset: BaziLuckOffset
    }
  | {
      readonly precision: 'range'
      readonly earliest: BaziLocalDateTime
      readonly latest: BaziLocalDateTime
    }

export interface BaziChartCandidate {
  readonly id: string
  readonly possibleBirthTimeRanges: BaziTimeRange[]
  readonly dayMaster: string
  readonly pillars: BaziPillar[]
  readonly luck: {
    readonly direction: 'forward' | 'backward'
    readonly start: BaziLuckStart
    readonly periods: BaziLuckPeriod[]
  }
}

export interface BaziCalendarAnchor {
  readonly input: {
    readonly calendar: 'gregorian' | 'lunar'
    readonly year: number
    readonly month: number
    readonly day: number
    readonly leapMonth?: boolean
  }
  readonly solarDate: {
    readonly year: number
    readonly month: number
    readonly day: number
  }
  readonly lunarDate: {
    readonly year: number
    readonly month: number
    readonly day: number
    readonly leapMonth: boolean
    readonly display: string
  }
  readonly timeZone: string
}

export interface BaziChart {
  readonly system: 'bazi'
  readonly timePrecision: 'known' | 'unknown'
  readonly calendar: BaziCalendarAnchor
  readonly candidates: BaziChartCandidate[]
  readonly conventions: {
    readonly dayBoundary: ResolvedFateChartConventions['bazi']['dayBoundary']
    readonly luckStart: ResolvedFateChartConventions['bazi']['luckStart']
  }
  readonly provenance: {
    readonly provider: 'tyme4ts'
    readonly providerVersion: '1.5.2'
  }
  readonly warnings: string[]
}
