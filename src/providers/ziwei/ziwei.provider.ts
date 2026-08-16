import type { ZiweiCalculationInput, ZiweiChart } from '../../capabilities/ziwei/ziwei.model.js'

export type ZiweiProviderResult =
  | { readonly ok: true; readonly chart: ZiweiChart }
  | {
      readonly ok: false
      readonly error: {
        readonly code: 'INVALID_LUNAR_DATE'
        readonly field: 'birth.date'
      }
    }

/** Provider port: iztro objects and global configuration must not cross this boundary. */
export interface ZiweiProvider {
  calculate(input: ZiweiCalculationInput): ZiweiProviderResult
}
