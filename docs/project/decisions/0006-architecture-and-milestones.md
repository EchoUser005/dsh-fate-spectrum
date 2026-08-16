# ADR 0006：长期架构与活动里程碑分层

- 状态：已接受
- 确认日期：2026-08-16

## 背景

原 `docs/architecture.md` 同时包含长期架构、`0.1.0` 范围、精确目录树、Provider 探针、测试 Gate 和已知限制，导致长期护栏与临时开发计划混在一起。现有 `iterations/` 只能记录单轮工作，也没有覆盖一个 MVP 跨多轮推进和完成后归档的生命周期。

## 决定

- `docs/architecture.md` 只保存长期架构、TypeScript 设计判断、稳定依赖方向和演进护栏。
- 当前版本的范围、详细代码树、TODO、决策门和完成定义进入 `docs/project/milestones/`。
- 同一时间只有一个活动里程碑，由 `PROJECT_STATE.md` 直接链接。
- 用户正式开发期间主要审核活动里程碑是否发生范围、契约、默认值或完成定义偏移。
- 每轮 iteration 记录实际工作和证据；里程碑跨多轮汇总进度。
- 里程碑完成并经用户确认后移入 `milestones/archive/`；归档不代表已经发布。

## 影响

Coding Agent 先通过 `PROJECT_STATE.md` 找到当前里程碑，再按任务读取长期架构、Tool 契约、ADR 或 Provider 证据。MVP 目录变化不会反复污染长期架构；长期边界变化也不能借普通 TODO 静默发生。
