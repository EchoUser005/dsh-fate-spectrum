# ADR 0010：按独立用户任务拆分模型可见 Tool

- 状态：已接受
- 确认日期：2026-08-16
- 取代：ADR 0002 中“插件长期只暴露一个 Tool”的解释

## 背景

DSH 的 Tool registry 可以在同一插件生命周期中注册多个 Tool。此前把 v0.1.0 的单 Tool 范围误写成了插件长期只能有一个模型可见 Tool，导致排盘时间校准与“下下周”时间范围解析被混成同一能力。

两类时间问题的用户任务和输入输出并不相同：

- 出生时刻校准只为排盘服务，输入出生时间、地点和校准模式，输出实际用于排盘的时间。
- 干支历查询服务于周报、择时和周期分析，输入相对或绝对时间范围，输出确定日期、节气和干支上下文。

## 决定

- 插件长期允许注册多个模型可见 Tool；Tool 按独立用户任务拆分，不按第三方库、每个原子函数或每种命理体系拆分。
- v0.1.0 只交付排盘 Tool `calculate_fate_chart`，由 `FateChartExecutor` 编排出生时刻校准、八字和紫微原子引擎。
- 后续独立里程碑交付干支历 Tool；公共名称和 Schema 在该里程碑开始前单独审核，由独立的 `GanzhiCalendarExecutor` 编排时间范围与干支历能力。
- 出生时刻校准不注册独立 Tool，也不由干支历 Tool 间接提供；它是排盘 Tool 的内部原子能力。
- 周报等 Skill 可以指导 Agent 先调用干支历 Tool，再调用排盘 Tool，最后结合两份 canonical fact 完成分析。
- 未来 A2UI 通过稳定 Presentation DTO 或 DSH 可重放事件消费事实，不从 Observation 文本反解析数据。

## 典型任务链

```text
用户：“帮我看看下下周的运势”
  -> Agent 消歧时间范围，并确认出生资料与真太阳时选项
  -> 干支历 Tool：得到下下周的准确起止日期、流年、流月和逐日干支
  -> calculate_fate_chart：得到命盘与运限事实
  -> 周报 Skill：组织干支作用、解释、建议和结果结构
  -> A2UI（后续）：渲染周历、命盘或趋势组件
```

## 影响

- “一个 Tool 对应一个任务级 Executor”继续成立，但“一个插件只能有一个 Tool”不成立。
- v0.1.0 不因长期存在第二个 Tool 而扩大当前代码树；干支历 Tool 的契约、目录和测试只在其活动里程碑开启。
- 新增其他模型可见 Tool 仍属于公共产品边界变化，必须先经用户确认。

## DSH 依据

- Tool 注册教程：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/tool.zh.md>
- Tool 编写参考：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.zh.md>

DSH 通过 `ctx.tools.register(defineTool(...))` 逐项注册 Tool，并由 Cordis effect 生命周期负责注销；注册表没有把一个插件限制为一个 Tool。
