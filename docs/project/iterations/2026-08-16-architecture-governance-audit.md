# 架构治理与渐进披露审计

日期：2026-08-16

## 本轮目标

- 固化 README 各栏目的更新时机，隔离产品版本史与开发记录。
- 审计 `AGENTS.md` 的文档入口和渐进式披露是否足以支持正式开发。
- 对照仓库外架构资料，判断长期 TypeScript 架构与 MVP 详细设计应如何分层。

## 已完成

- 完整阅读仓库外的 Pi Agent、TypeScript、Cordis、设计模式与 Harness 架构参考资料。
- 在 `AGENTS.md` 增加 README 分栏目更新触发表和禁止内容。
- 将 `docs/project/CHANGELOG.md` 定义为每轮一句的开发变更索引，不再充当 README 产品版本史。

## 审计结论

- 当前 `docs/architecture.md` 混合了长期架构护栏、`0.1.0` 范围、精确目录树、Provider 探针、测试 Gate 和已知限制，阅读职责过重。
- 当前项目记录只有单轮 `iterations/`，没有覆盖多轮 MVP 计划从激活到归档的里程碑层。
- `AGENTS.md` 已覆盖端口与适配器、依赖注入、判别联合、纯投影和 Cordis Effect，但仍缺少 TypeScript 边界校验、配置快照、抽象触发条件和最小复用门槛。

## 待用户确认

- 用户复审 `milestones/v0.1.0.md` 的详细范围、代码树、TODO 和完成定义。
- 复审通过后，单独授权 Provider 依赖安装与技术探针。

## 已实施的分层

- `docs/architecture.md` 已收束为长期架构与 TypeScript 设计护栏。
- `docs/project/milestones/v0.1.0.md` 已承载当前版本的详细代码树、TODO、决策门和完成定义。
- `docs/project/milestones/README.md` 已定义单一活动里程碑和完成后归档流程。
- `PROJECT_STATE.md` 已直接链接活动里程碑和当前 iteration。
