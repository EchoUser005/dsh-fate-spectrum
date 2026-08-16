export type CalculationFailureCategory = 'invalid_input' | 'unsupported' | 'provider'

export interface CalculationWarning {
  readonly code: string
  readonly field?: string
}

export interface CalculationFailure {
  readonly code: string
  readonly category: CalculationFailureCategory
  readonly field?: string
}

export type CalculationOutcome<T> =
  | {
      readonly ok: true
      readonly value: T
      readonly warnings: readonly CalculationWarning[]
    }
  | {
      readonly ok: false
      readonly error: CalculationFailure
    }
