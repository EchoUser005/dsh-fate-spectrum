# ADR 0011：八字首版契约与换日起运默认

- 状态：已接受
- 确认日期：2026-08-16

## 背景

用户已审核 `calculate_fate_chart` 的首版模型参数、八字响应字段和 Observation 方向。Tyme 探针确认四柱、藏干、十神、纳音、旬空、十二长生、起运和大运可以映射成稳定领域结果，同时暴露了晚子时换日和起运算法的真实差异。

晚子时存在两种实际采用的规则：23:00 起使用次日日柱，或 23:00–23:59 仍使用当日日柱。Tyme 将前者作为默认并为后者提供显式 Provider；神机阁公开说明也将 23 点换日描述为主流用法。

## 决定

- 接受首版 Tool 输入结构：显式公历／农历、已知／未知时辰、地点、民用时／真太阳时模式、性别、`systems` 和可选计算约定。
- v0.1.0 暂不把 `name`、`relation`、时间范围、`include`、`referenceDate` 或 `locale` 放入模型参数。
- 八字响应包含历法锚点、四柱、藏干及藏干十神、柱干十神、纳音、旬空、十二长生、起运、大运、来源和 warnings；神煞与命理解读后续单独设计。
- 默认换日规则为 `zi_hour_next_day`：先完成真太阳时校准，再以实际排盘时间的 23:00 作为次日日柱起点。
- 保留 `late_zi_same_day` 显式选项；无论默认或显式选择，结果都披露规则来源。
- 默认起运规则为 `lunar_sect_1`，与用户选定的参考排盘行为保持一致；其他 Tyme 起运算法保留为显式选项。
- Observation 展示大运时同时写出交运年份和年龄，例如“丙子大运：2004 年交运，6–15 周岁”，不得只写容易歧义的“6–15”。

## 依据

- Tyme 八字 Provider：<https://6tail.cn/tyme.html>
- Tyme 变更记录：<https://github.com/6tail/tyme4ts/blob/master/CHANGELOG.md>
- 神机阁早晚子时说明：<https://www.shenjige.cn/details/RD_IfLAgza.html>

## 影响

- `resolveConventions()` 必须产生上述稳定默认值并记录 `source: default | explicit`。
- 真太阳时修正可能跨过 23:00 或日期边界，必须先校准、后换日，并对跨界结果产生明确 warning。
- Tyme 的流派 Provider 使用共享可变配置时必须调用级恢复并保守串行；并发隔离测试通过前不得声明并发安全。
- 未知时辰可返回哪些字段、地点解析精度和紫微默认值仍是后续决策门。
