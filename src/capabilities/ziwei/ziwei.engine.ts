import type { CalculationOutcome } from '../../domain/calculation-outcome.js'
import type { CalculationExecutionContext } from '../../domain/execution-context.js'
import type { ZiweiCalculationInput, ZiweiChart } from './ziwei.model.js'

export interface ZiweiCalculationEngine {
  calculate(
    input: ZiweiCalculationInput,
    context: CalculationExecutionContext,
  ): Promise<CalculationOutcome<ZiweiChart>>
}
