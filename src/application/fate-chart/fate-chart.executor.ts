import type { BaziCalculationEngine } from '../../capabilities/bazi/bazi.engine.js'
import type { BaziChart } from '../../capabilities/bazi/bazi.model.js'
import type { TimeCalculationEngine } from '../../capabilities/time/time.engine.js'
import type { ResolvedCalculationTimeDraft } from '../../capabilities/time/time.model.js'
import type { ZiweiCalculationEngine } from '../../capabilities/ziwei/ziwei.engine.js'
import type { ZiweiChart } from '../../capabilities/ziwei/ziwei.model.js'
import type { CalculationOutcome } from '../../domain/calculation-outcome.js'
import type { CalculationExecutionContext } from '../../domain/execution-context.js'
import type { ResolvedFateChartConventions } from '../../domain/fate-chart-conventions.js'
import type { FateSystem } from '../../domain/fate-system.js'
import type { NormalizedBirth } from '../../domain/normalized-birth.js'

export interface FateChartExecutionRequest {
  readonly birth: NormalizedBirth
  readonly systems: readonly FateSystem[]
  readonly conventions: ResolvedFateChartConventions
}

export type FateChartSystemOutcome =
  | {
      readonly system: 'bazi'
      readonly outcome: CalculationOutcome<BaziChart>
    }
  | {
      readonly system: 'ziwei'
      readonly outcome: CalculationOutcome<ZiweiChart>
    }

/**
 * Internal execution result, intentionally not the public Tool output. The DSH
 * adapter maps it through the versioned canonical contract.
 */
export interface FateChartExecutionResult {
  readonly requestedSystems: readonly FateSystem[]
  readonly timeOutcome: CalculationOutcome<ResolvedCalculationTimeDraft>
  readonly systemOutcomes: readonly FateChartSystemOutcome[]
}

export interface FateChartExecutorDependencies {
  readonly time: TimeCalculationEngine
  readonly bazi: BaziCalculationEngine
  readonly ziwei: ZiweiCalculationEngine
}

export class FateChartExecutor {
  readonly #dependencies: FateChartExecutorDependencies

  constructor(dependencies: FateChartExecutorDependencies) {
    this.#dependencies = dependencies
  }

  async execute(
    request: FateChartExecutionRequest,
    context: CalculationExecutionContext,
  ): Promise<FateChartExecutionResult> {
    assertRequestedSystems(request.systems)

    context.signal.throwIfAborted()
    const timeOutcome = await this.#dependencies.time.calculate(
      {
        birth: request.birth,
        mode: request.conventions.timeMode.value,
      },
      context,
    )

    if (!timeOutcome.ok) {
      return {
        requestedSystems: [...request.systems],
        timeOutcome,
        systemOutcomes: [],
      }
    }

    const systemOutcomes: FateChartSystemOutcome[] = []

    // Keep the first implementation sequential until provider probes prove
    // that every selected engine is isolated and safe to run concurrently.
    for (const system of request.systems) {
      context.signal.throwIfAborted()

      if (system === 'bazi') {
        systemOutcomes.push({
          system,
          outcome: await this.#dependencies.bazi.calculate(
            {
              birth: request.birth,
              resolvedTime: timeOutcome.value,
              conventions: request.conventions.bazi,
            },
            context,
          ),
        })
        continue
      }

      systemOutcomes.push({
        system,
        outcome: await this.#dependencies.ziwei.calculate(
          {
            birth: request.birth,
            resolvedTime: timeOutcome.value,
            conventions: request.conventions.ziwei,
          },
          context,
        ),
      })
    }

    return {
      requestedSystems: [...request.systems],
      timeOutcome,
      systemOutcomes,
    }
  }
}

function assertRequestedSystems(systems: readonly FateSystem[]): void {
  if (systems.length === 0) {
    throw new TypeError('FateChartExecutionRequest.systems must not be empty')
  }

  if (new Set(systems).size !== systems.length) {
    throw new TypeError('FateChartExecutionRequest.systems must not contain duplicates')
  }
}
