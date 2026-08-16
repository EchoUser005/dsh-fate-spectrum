import type { ZiweiCalculationEngine } from './ziwei.engine.js'

/**
 * Honest development boundary used until the Ziwei provider is implemented.
 * The future DSH adapter must map this internal outcome through a user-approved
 * canonical error contract; it must never manufacture placeholder chart data.
 */
export class UnavailableZiweiEngine implements ZiweiCalculationEngine {
  async calculate() {
    return {
      ok: false as const,
      error: {
        code: 'ZIWEI_NOT_IMPLEMENTED',
        category: 'unsupported' as const,
      },
    }
  }
}
