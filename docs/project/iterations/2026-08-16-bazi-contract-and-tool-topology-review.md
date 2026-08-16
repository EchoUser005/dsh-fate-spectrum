# 迭代记录：八字契约与多 Tool 边界复审

- 日期：2026-08-16
- 分支：`feat/tool-skeleton`
- 状态：文档收敛完成，等待用户复核

## 目标

根据用户对实际周报工作流和八字排盘结果的审核，修正“插件长期只有一个 Tool”的错误限制，确认 v0.1.0 八字输入输出方向，并以公开资料确定晚子时默认规则。本轮不写运行时代码、不安装仓库依赖、不提交或 push。

## 用户确认

- `calculate_fate_chart` 首版输入 Schema 与 description 方向通过。
- 八字基础 response 足以支持 Agent 分析与未来 A2UI 命盘投影；神煞后续再设计。
- Observation 方向通过；大运需同时标明交运年份和周岁范围。
- 排盘与干支时间范围是两个独立模型 Tool；周报 Skill 负责指导 Agent 依次取得时间上下文和命盘事实，再组织分析与未来 A2UI。
- 真太阳时校准只服务排盘，继续作为 `FateChartExecutor` 内部原子能力，不注册独立 Tool。
- 起运默认采用 `lunar_sect_1`，其他 Tyme 算法保留显式选择。

## 晚子时调研与决定

公开资料确认 23:00 换用次日日柱和 00:00 换日两派均真实存在。Tyme 默认使用 23:00 换日，并提供晚子时仍算当天的显式 Provider；神机阁公开说明将 23 点换日描述为主流、早晚子时分法使用者较少。

因此 v0.1.0 默认 `zi_hour_next_day`：先完成真太阳时校准，再以实际排盘时间的 23:00 作为换日点。保留 `late_zi_same_day` 显式选项，结果必须披露规则；校准跨过换日点时产生 warning。

依据：

- <https://6tail.cn/tyme.html>
- <https://github.com/6tail/tyme4ts/blob/master/CHANGELOG.md>
- <https://www.shenjige.cn/details/RD_IfLAgza.html>

## 文档改动

- 长期架构改为同一插件可按独立用户任务注册多个 Tool，每个 Tool 对应独立任务级 Executor。
- 新增 ADR 0010，明确排盘 Tool、后续干支历 Tool、周报 Skill 与 A2UI 的组合关系。
- 新增 ADR 0011，记录首版八字字段、`zi_hour_next_day`、`lunar_sect_1` 和 Observation 年龄表达。
- v0.1.0 里程碑继续只交付 `calculate_fate_chart`，但不再把单 Tool 误写成长期限制。
- Tool 契约与 develop 技术方案区分出生时刻校准和后续干支时间范围能力，清理相互冲突的未决项。

## 本轮边界

- 未实现或注册干支历 Tool；其公共名称、Schema、目录和测试留给后续里程碑。
- 未实现 `calculate_fate_chart`、Tyme Provider、真太阳时或紫微计算。
- 未把用户真实生日、截图数据或私人规划写入仓库。
- 未修改 README；当前公开能力没有变化。
- 未 commit、push、创建 PR、Tag、Release 或发布 npm。

## 下一步

用户复核本轮文档后，进入已确认 `calculate_fate_chart` Schema 的 DSH `defineTool` + `--patch` 纵向骨架；只使用人工构造结果验证注册、缺参、canonical output 和 Observation。
