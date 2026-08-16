# ADR 0008：一个排盘 Executor 编排独立原子引擎

- 状态：已接受
- 确认日期：2026-08-16
- 取代：ADR 0003 中“两个 Executor”的表述

## 背景

早期设计把八字和紫微的独立性写成“两个 Provider/Executor”，容易把任务编排与原子计算混为一层。用户明确要求：排盘是一个 Executor，它依据模型传入的 `systems` 决定执行八字、紫微或两者，并引用原子能力目录中的独立计算引擎。

## 决定

- `calculate_fate_chart` 对应唯一的排盘任务级 `FateChartExecutor`；这不限制同一插件在后续里程碑为另一项用户任务注册另一 Tool 和 Executor。
- `FateChartExecutor` 负责共享输入归一化、计算约定快照、系统路由、结果组合和顶层失败语义。
- 八字、紫微与时间校准是独立原子计算引擎，各自拥有可审核的输入、输出和不变量。
- Tyme、iztro 等 Provider 是原子引擎背后的第三方防腐层，不是任务级 Executor。
- canonical value 到模型 Observation 的翻译由 DSH `output.render()` 负责，不让八字和紫微引擎分别拼接模型文本。

## 影响

正式实现先用人工构造引擎验证一个 Executor 的单系统／双系统路由，再优先纵向交付八字，最后开发紫微。紫微未实现期间只报告明确的本能力失败 outcome，不生成预设命盘；是否映射成 `unsupported` 或 `partial` 由用户审核公共契约后决定。`partial` 由统一 Executor 组合，单个引擎只报告本能力 outcome。

本 ADR 只约束排盘内部不得拆成八字、紫微两个任务级 Executor。后续干支历 Tool 的独立 Executor 由 ADR 0010 约束，不与 `FateChartExecutor` 合并。
