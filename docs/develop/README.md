# 开发技术方案

本目录保存活动版本的开发技术方案。它回答“代码怎样组织、每一层负责什么、按什么顺序实现和验证”，不替代产品里程碑、Tool 契约或项目状态。

## 文档边界

- `docs/project/milestones/`：用户要得到什么、哪些能力不在本版、在哪些节点验收。
- `docs/tool-layer.md`：模型可见 Tool、canonical output、错误与 Observation 契约。
- `docs/architecture.md`：长期依赖方向、TypeScript 约束和何时建立新边界。
- `docs/develop/`：当前版本的目录树、文件职责、依赖组装、实现切片和测试设计。
- `docs/project/iterations/`：每轮真正改了什么、跑了什么证据、还剩什么。

## 使用规则

1. 活动里程碑必须链接一份主要技术方案。
2. 技术方案先作为“提案”由用户审核；批准后才允许按它创建运行时代码。
3. 公共 Schema、错误语义、默认计算约定和用户体验仍以专项真相源及用户决定为准，不能被技术方案静默冻结。
4. 文件树可以随 Provider 探针结果调整，但必须保持长期架构边界；职责变化先展示 diff。
5. 版本完成后冻结最终实现和证据，将技术方案移动到 `archive/<version>/`，不继续把历史方案改成新版本设计。

## 当前方案

- [`calculate-fate-chart-v0.1.0.md`](calculate-fate-chart-v0.1.0.md)：`calculate_fate_chart` v0.1.0 开发技术方案。
- [`fate-chart-capability-contracts-v0.1.0.md`](fate-chart-capability-contracts-v0.1.0.md)：共享出生信息、时间、八字、紫微和 Executor 输入输出审核稿。
- [`dsh-local-test-sop.md`](dsh-local-test-sop.md)：首个 `defineTool → Executor → output.render()` 切片的本地人工测试步骤。
- [`tyme-bazi-provider-probe-1.5.2.md`](tyme-bazi-provider-probe-1.5.2.md)：Tyme 八字字段、流派隔离、重复确定性与未知时辰边界的探针证据。
