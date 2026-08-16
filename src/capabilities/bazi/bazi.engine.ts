import type { CalculationOutcome } from '../../domain/calculation-outcome.js'
import type { CalculationExecutionContext } from '../../domain/execution-context.js'
import type { BaziCalculationInput, BaziChart } from './bazi.model.js'

export interface BaziCalculationEngine {
  calculate(
    input: BaziCalculationInput,
    context: CalculationExecutionContext,
  ): Promise<CalculationOutcome<BaziChart>>
}
