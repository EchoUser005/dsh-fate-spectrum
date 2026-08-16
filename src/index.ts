import type { Context } from '@deepseek-ai/cordis'

import { createCalculateFateChartTool } from './adapters/dsh/calculate-fate-chart.tool.js'
import { FateChartExecutor } from './application/fate-chart/fate-chart.executor.js'
import { ProviderBackedBaziEngine } from './capabilities/bazi/provider-backed-bazi.engine.js'
import { BaselineTimeEngine } from './capabilities/time/baseline-time.engine.js'
import { ProviderBackedZiweiEngine } from './capabilities/ziwei/provider-backed-ziwei.engine.js'
import { TymeBaziProvider } from './providers/bazi/tyme-bazi.provider.js'
import { IztroZiweiProvider } from './providers/ziwei/iztro-ziwei.provider.js'

export const name = 'dsh-fate-spectrum'
export const inject = ['tools'] as const

export function apply(ctx: Context): void {
  const executor = new FateChartExecutor({
    time: new BaselineTimeEngine(),
    bazi: new ProviderBackedBaziEngine(new TymeBaziProvider()),
    ziwei: new ProviderBackedZiweiEngine(new IztroZiweiProvider()),
  })

  ctx.tools.register(createCalculateFateChartTool(executor))
}
