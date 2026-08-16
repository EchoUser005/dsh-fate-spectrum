import type { ZiweiProvider } from '../../providers/ziwei/ziwei.provider.js'
import type { ZiweiCalculationEngine } from './ziwei.engine.js'

export class ProviderBackedZiweiEngine implements ZiweiCalculationEngine {
  readonly #provider: ZiweiProvider

  constructor(provider: ZiweiProvider) {
    this.#provider = provider
  }

  async calculate(
    input: Parameters<ZiweiCalculationEngine['calculate']>[0],
    context: Parameters<ZiweiCalculationEngine['calculate']>[1],
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
