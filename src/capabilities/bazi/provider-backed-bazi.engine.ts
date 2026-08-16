import type { BaziProvider } from '../../providers/bazi/bazi.provider.js'
import type { BaziCalculationEngine } from './bazi.engine.js'

export class ProviderBackedBaziEngine implements BaziCalculationEngine {
  readonly #provider: BaziProvider

  constructor(provider: BaziProvider) {
    this.#provider = provider
  }

  async calculate(
    input: Parameters<BaziCalculationEngine['calculate']>[0],
    context: Parameters<BaziCalculationEngine['calculate']>[1],
  ) {
    context.signal.throwIfAborted()
    const result = this.#provider.calculate(input)
    context.signal.throwIfAborted()

    if (!result.ok) {
      return {
        ok: false as const,
        error: {
          code: result.error.code,
          category: 'invalid_input' as const,
          field: result.error.field,
        },
      }
    }

    return { ok: true as const, value: result.chart, warnings: [] }
  }
}
