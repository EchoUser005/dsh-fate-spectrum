import type { BaziCalculationInput, BaziChart } from '../../capabilities/bazi/bazi.model.js'

export type BaziProviderResult =
  | { readonly ok: true; readonly chart: BaziChart }
  | {
      readonly ok: false
      readonly error: {
        readonly code: 'INVALID_LUNAR_DATE'
        readonly field: 'birth.date'
      }
    }

/** Provider port: third-party objects must not cross this boundary. */
export interface BaziProvider {
  calculate(input: BaziCalculationInput): BaziProviderResult
}
