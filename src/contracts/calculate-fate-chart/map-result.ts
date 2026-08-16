import type { FateChartExecutionResult } from '../../application/fate-chart/fate-chart.executor.js'
import type { CalculateFateChartResult } from './schemas.js'

const SCHEMA_VERSION = '0.1.0' as const

export function mapFateChartExecutionResult(
  execution: FateChartExecutionResult,
): CalculateFateChartResult {
  if (!execution.timeOutcome.ok) {
    if (execution.timeOutcome.error.code !== 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED') {
      throw new Error(`Unexpected time engine outcome: ${execution.timeOutcome.error.code}`)
    }

    return {
      status: 'unsupported',
      schemaVersion: SCHEMA_VERSION,
      requestedSystems: [...execution.requestedSystems],
      error: {
        code: 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED',
        retryable: false,
        systems: execution.requestedSystems.map((system) => ({
          system,
          code: 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED' as const,
        })),
      },
    }
  }

  const invalidInput = execution.systemOutcomes.find(
    ({ outcome }) => !outcome.ok && outcome.error.category === 'invalid_input',
  )
  if (invalidInput !== undefined && !invalidInput.outcome.ok) {
    if (invalidInput.outcome.error.code !== 'INVALID_LUNAR_DATE') {
      throw new Error(`Unexpected provider input outcome: ${invalidInput.outcome.error.code}`)
    }
    return {
      status: 'needs_clarification',
      schemaVersion: SCHEMA_VERSION,
      requestedSystems: [...execution.requestedSystems],
      error: {
        code: 'INVALID_LUNAR_DATE',
        retryable: true,
        field: 'birth.date',
        repair: '该农历日期或闰月不存在；请核对农历年月日与 leapMonth 后重新调用。',
      },
    }
  }

  const systems = execution.systemOutcomes.map(({ system, outcome }) => {
    if (system === 'bazi' && outcome.ok) {
      return {
        system: 'bazi' as const,
        status: 'success' as const,
        chart: outcome.value,
      }
    }

    if (system === 'ziwei' && outcome.ok) {
      return {
        system: 'ziwei' as const,
        status: 'success' as const,
        chart: outcome.value,
      }
    }

    if (outcome.ok) throw new Error(`Unexpected successful system: ${system}`)

    assertUnavailableSystemCode(system, outcome.error.code)
    return {
      system,
      status: 'unsupported' as const,
      error: {
        code: outcome.error.code,
        retryable: false as const,
      },
    }
  })

  if (systems.length !== execution.requestedSystems.length) {
    throw new Error('Every requested system must have exactly one outcome')
  }

  const successCount = systems.filter(({ status }) => status === 'success').length
  if (successCount === systems.length) {
    return {
      status: 'success',
      schemaVersion: SCHEMA_VERSION,
      requestedSystems: [...execution.requestedSystems],
      systems: systems.map((system) => {
        if (system.status !== 'success') throw new Error('Success result contains a failure')
        return system
      }),
    }
  }

  if (successCount > 0) {
    return {
      status: 'partial',
      schemaVersion: SCHEMA_VERSION,
      requestedSystems: [...execution.requestedSystems],
      systems,
    }
  }

  return {
    status: 'unsupported',
    schemaVersion: SCHEMA_VERSION,
    requestedSystems: [...execution.requestedSystems],
    error: {
      code: 'REQUESTED_SYSTEMS_UNAVAILABLE',
      retryable: false,
      systems: systems.map((system) => {
        if (system.status !== 'unsupported') throw new Error('Unsupported result contains success')
        return { system: system.system, code: system.error.code }
      }),
    },
  }
}

function assertUnavailableSystemCode(
  system: 'bazi' | 'ziwei',
  code: string,
): asserts code is 'BAZI_NOT_IMPLEMENTED' | 'ZIWEI_NOT_IMPLEMENTED' {
  const expectedCode = system === 'bazi' ? 'BAZI_NOT_IMPLEMENTED' : 'ZIWEI_NOT_IMPLEMENTED'
  if (code !== expectedCode) {
    throw new Error(`Unexpected ${system} engine outcome: ${code}`)
  }
}
