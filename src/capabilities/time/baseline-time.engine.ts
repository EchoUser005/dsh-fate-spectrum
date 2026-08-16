import type { TimeCalculationEngine } from './time.engine.js'

/**
 * Honest slice-1 implementation: civil time passes through unchanged, while
 * apparent solar time remains unavailable until its algorithm is reviewed.
 */
export class BaselineTimeEngine implements TimeCalculationEngine {
  async calculate(input: Parameters<TimeCalculationEngine['calculate']>[0]) {
    if (input.mode === 'apparent') {
      return {
        ok: false as const,
        error: {
          code: 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED',
          category: 'unsupported' as const,
          field: 'conventions.timeMode',
        },
      }
    }

    return {
      ok: true as const,
      value:
        input.birth.time.status === 'known'
          ? {
              status: 'known' as const,
              inputTime: input.birth.time,
              calculationTime: input.birth.time,
              mode: 'civil' as const,
            }
          : {
              status: 'unknown' as const,
              inputTime: input.birth.time,
              mode: 'civil' as const,
            },
      warnings: [],
    }
  }
}
