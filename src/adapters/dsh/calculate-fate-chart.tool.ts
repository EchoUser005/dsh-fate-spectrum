import { defineTool } from '@deepseek-ai/dsh-tools'

import type { FateChartExecutor } from '../../application/fate-chart/fate-chart.executor.js'
import { mapCalculateFateChartRequest } from '../../contracts/calculate-fate-chart/map-request.js'
import { mapFateChartExecutionResult } from '../../contracts/calculate-fate-chart/map-result.js'
import {
  calculateFateChartOutputSchema,
  calculateFateChartParameters,
} from '../../contracts/calculate-fate-chart/schemas.js'
import { renderFateChartObservation } from '../../projections/observation/render-fate-chart-observation.js'

export const CALCULATE_FATE_CHART_DESCRIPTION =
  '当用户要求四柱八字、紫微斗数排盘，或提出必须先取得命盘事实才能回答的命理分析时调用。调用前必须取得出生日期、性别、明确的出生时辰状态和 IANA 时区；真太阳时还需要经度。systems 可选 bazi、ziwei 或两者，省略时默认同时请求。不要用本工具解析“下周”等时间范围，也不要把模型推测当作排盘事实。'

export function createCalculateFateChartTool(executor: FateChartExecutor) {
  return defineTool({
    name: 'calculate_fate_chart',
    description: CALCULATE_FATE_CHART_DESCRIPTION,
    parameters: calculateFateChartParameters,
    output: {
      schema: calculateFateChartOutputSchema,
      render: (_args, value) => renderFateChartObservation(value),
    },
    async execute(args, exec) {
      const mapped = mapCalculateFateChartRequest(args)
      if (!mapped.ok) return mapped.result

      const execution = await executor.execute(mapped.request, { signal: exec.signal })
      return mapFateChartExecutionResult(execution)
    },
  })
}
