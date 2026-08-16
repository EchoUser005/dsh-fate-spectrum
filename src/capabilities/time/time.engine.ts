import type { CalculationOutcome } from '../../domain/calculation-outcome.js'
import type { CalculationExecutionContext } from '../../domain/execution-context.js'
import type { ResolvedCalculationTimeDraft, TimeCalculationInput } from './time.model.js'

export interface TimeCalculationEngine {
  calculate(
    input: TimeCalculationInput,
    context: CalculationExecutionContext,
  ): Promise<CalculationOutcome<ResolvedCalculationTimeDraft>>
}
