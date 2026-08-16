import type { TimeCorrectionMode } from '../../domain/fate-chart-conventions.js'
import type {
  KnownBirthClockTime,
  NormalizedBirth,
  UnknownBirthClockTime,
} from '../../domain/normalized-birth.js'

export interface TimeCalculationInput {
  readonly birth: NormalizedBirth
  readonly mode: TimeCorrectionMode
}

/** Draft review surface; provenance fields are added only after provider probes. */
export type ResolvedCalculationTimeDraft =
  | {
      readonly status: 'known'
      readonly inputTime: KnownBirthClockTime
      readonly calculationTime: KnownBirthClockTime
      readonly mode: TimeCorrectionMode
    }
  | {
      readonly status: 'unknown'
      readonly inputTime: UnknownBirthClockTime
      readonly mode: TimeCorrectionMode
    }
