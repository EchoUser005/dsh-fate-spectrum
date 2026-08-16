import type { NormalizedBirth } from '../../domain/normalized-birth.js'
import type { ResolvedFateChartConventions } from '../../domain/fate-chart-conventions.js'
import type { ResolvedCalculationTimeDraft } from '../time/time.model.js'

export interface ZiweiCalculationInput {
  readonly birth: NormalizedBirth
  readonly resolvedTime: ResolvedCalculationTimeDraft
  readonly conventions: ResolvedFateChartConventions['ziwei']
}

export type ZiweiPalaceId =
  | 'life'
  | 'siblings'
  | 'spouse'
  | 'children'
  | 'wealth'
  | 'health'
  | 'travel'
  | 'friends'
  | 'career'
  | 'property'
  | 'spirit'
  | 'parents'

export type ZiweiTransformationId = 'lu' | 'quan' | 'ke' | 'ji'

export interface ZiweiTimeRange {
  readonly start: string
  readonly end: string
}

export interface ZiweiStar {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly scope: string
  readonly brightness?: string
  readonly transformation?: {
    readonly id: ZiweiTransformationId
    readonly name: string
  }
}

export interface ZiweiPalace {
  readonly index: number
  readonly id: ZiweiPalaceId
  readonly name: string
  readonly heavenlyStem: string
  readonly earthlyBranch: string
  readonly isLifePalace: boolean
  readonly isBodyPalace: boolean
  readonly isOriginalPalace: boolean
  readonly stars: ZiweiStar[]
  readonly decadal: {
    readonly startAge: number
    readonly endAge: number
    readonly ganzhi: string
  }
}

export interface ZiweiChartCandidate {
  readonly id: string
  readonly possibleBirthTimeRanges: ZiweiTimeRange[]
  readonly timeSlot: {
    readonly index: number
    readonly name: string
    readonly range: ZiweiTimeRange
  }
  readonly chineseDate: string
  readonly lifePalace: ZiweiPalaceAnchor
  readonly bodyPalace: ZiweiPalaceAnchor
  readonly soul: string
  readonly body: string
  readonly fiveElementsClass: string
  readonly palaces: ZiweiPalace[]
}

export interface ZiweiPalaceAnchor {
  readonly palaceId: ZiweiPalaceId
  readonly heavenlyStem: string
  readonly earthlyBranch: string
}

export interface ZiweiCalendarAnchor {
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

export interface ZiweiChart {
  readonly system: 'ziwei'
  readonly timePrecision: 'known' | 'unknown'
  readonly calendar: ZiweiCalendarAnchor
  readonly candidates: ZiweiChartCandidate[]
  readonly conventions: ResolvedFateChartConventions['ziwei'] & {
    readonly dayBoundary: 'zi_hour_next_day'
    readonly yearBoundary: 'lunar_new_year'
    readonly horoscopeBoundary: 'lunar_new_year'
    readonly ageBoundary: 'nominal_year'
  }
  readonly provenance: {
    readonly provider: 'iztro'
    readonly providerVersion: '2.5.8'
  }
  readonly warnings: string[]
}
