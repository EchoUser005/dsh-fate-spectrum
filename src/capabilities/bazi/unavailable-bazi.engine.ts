import type { BaziCalculationEngine } from './bazi.engine.js'

/** Slice-1 boundary: never manufacture Bazi facts before the Tyme provider exists. */
export class UnavailableBaziEngine implements BaziCalculationEngine {
  async calculate() {
    return {
      ok: false as const,
      error: {
        code: 'BAZI_NOT_IMPLEMENTED',
        category: 'unsupported' as const,
      },
    }
  }
}
