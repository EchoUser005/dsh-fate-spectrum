# 项目状态

最后更新：2026-08-16

## 当前阶段

Phase 0 已通过 PR #1 合并到 `main`。当前正在建立 GitHub CI、PR 模板和主分支合并门禁；不修改运行时代码、Tool 契约或命理计算设计。

## 活动导航

- 活动里程碑：[`milestones/v0.1.0.md`](milestones/v0.1.0.md)
- 当前迭代：[`iterations/2026-08-16-ci-foundation.md`](iterations/2026-08-16-ci-foundation.md)
- 长期架构：[`../architecture.md`](../architecture.md)
- Tool 契约：[`../tool-layer.md`](../tool-layer.md)

## 已确认基线

- Node.js：官方兼容范围为 `^22.19.0 || >=24.0.0`；本地开发基线固定为 `24.19.0`。
- 包管理器：`pnpm@11.7.0`。
- 包格式：ESM，声明 `"type": "module"`。
- 当前只建立 TypeScript 工程基线，不安装 DSH、Cordis 或命理 Provider。
- 面向人的文档、ADR、迭代记录和汇报默认使用中文。
- `AGENTS.md` 只承载长期元指引；当前进度只在本文件维护。
- 公共测试只使用人工构造数据，私人规划和 fixture 不进入 Git。

## 已完成

- Phase 0 已通过 PR #1 squash merge 到 `main`。
- 仓库、公开/私人设计资料、DSH、tyme4ts 和 iztro 的只读开工审计。
- DSH 官方 Node.js、pnpm、ESM 基线确认。
- 最小 TypeScript、Vitest、Oxlint、Prettier 和 tsdown 基线。
- README、架构、Tool 层、Agent 指引、项目记录和仓库图片初稿。
- 本地打包产物安装与 ESM 导入 smoke。

## 本轮复审完成

- README 改为面向用户的结构化产品入口。
- `AGENTS.md` 改为稳定的元指引和文档路由器。
- 项目治理、ADR、迭代和第三方声明改为中文。
- 开发与发布闭环独立进入 `DEVELOPMENT_WORKFLOW.md`。
- README 二次复审后移除全部仓库状态与工程实现表述，只保留愿景、使用方式、隐私和边界。
- README 按用户原始语气重建为“定义与愿景、长期规划、使用指南、版本更新、核心技术、隐私与许可”的产品叙事，并建立用户可见变化才触发更新的维护规则。
- `AGENTS.md` 已增加 README 分栏目更新触发表，并将 README 产品版本史与每轮开发摘要彻底分离。
- `architecture.md` 已收束为长期架构、TypeScript 边界纪律和按需抽象触发条件。
- 新增 `v0.1.0` 活动里程碑，独立承载详细代码树、TODO、决策门、完成定义和归档流程。
- 用户已纠正正式开发主轴：一个排盘 Executor 根据 Tool 参数路由到原子能力目录中的八字、紫微计算引擎；具体分层、Schema 与 Observation 边界留待下一轮先确认理解，不在 Phase 0 擅自落地。

## 待后续确认

- DSH 集成时采用的精确预览版本及其 Profile/Bundle 安装验证。
- Provider 安装与探针方案。
- 未知时辰允许返回的字段。
- 换日、太阳时、闰月和紫微流派默认值。
- Tool Schema、canonical output 和稳定错误语义的最终冻结。

## 验证状态

Phase 0 已在 Node.js `24.19.0`、pnpm `11.7.0` 下通过本地基建验证。CI 基建轮的本地证据已通过，真实 GitHub Actions 待 PR 验证：

- Node.js `24.19.0` 下的格式、Lint、类型、测试、离线测试、构建与打包；
- Node.js `22.19.0` 下的最低兼容类型、测试与构建；
- 外部 PR 必须取得 `owner-approved` 标签的合并策略。

当前没有 DSH Adapter，DSH Profile smoke 不适用，也不能描述成已通过。

## 唯一下一步

先让 `chore/ci-foundation` 的真实 GitHub Actions 全部通过，再启用 `main` 规则集与仓库合并偏好。随后进入 `docs/v0.1-technical-design`，先审核长期架构、v0.1.0 功能里程碑、渐进式文档路由和详细开发技术方案，不开始运行时实现。
