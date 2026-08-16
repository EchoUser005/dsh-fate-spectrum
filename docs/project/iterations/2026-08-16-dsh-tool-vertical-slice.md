# 迭代：DSH Tool 纵向切片

- 日期：2026-08-16
- 分支：`feat/tool-skeleton`
- 目标：真实跑通 `defineTool → FateChartExecutor → output.render()`，交付用户可执行的 DSH `--patch` SOP

## 实现

- 锁定实际可安装的 DSH `0.1.0-rc.6` 与 Cordis `4.0.1`，记录 npm 与主仓库版本清单错位。
- 落地 `calculate_fate_chart` 嵌套参数 Schema、语义校验、默认双系统与已确认八字约定解析。
- Cordis 插件入口只注册一个排盘 Tool，并通过 `inject = ['tools']` 等待官方 Tool registry。
- `FateChartExecutor` 先执行一次共享出生时刻能力，再按 `systems` 顺序调用八字和紫微原子引擎；调用仍保持串行。
- 民用时使用无损透传的基线时间引擎；完整视太阳时、八字和紫微都在真实 Provider 接入前返回明确 unavailable，不构造假盘。
- canonical dev contract 只开放 `needs_clarification` 与 `unsupported`；真实 `success/partial` 数据结构等待八字 Provider 字段冻结后扩展。
- `output.render()` 只输出模型下一步需要的状态与修复动作，不重复 canonical JSON。
- 增加构建后本地 Patch 生成脚本和人工测试 SOP。

## 证据

- Node.js 22.19.0 与 24.19.0：格式、类型、Lint、14 项测试、离线测试与构建通过。
- `pnpm install --frozen-lockfile` 通过，直接引入的 DSH、Tool 与 Cordis 包均为 MIT。
- DSH `--dump-config` 的最后一层出现 `fate-spectrum -> lib/index.js`。
- 官方 Web Profile 在 `127.0.0.1:3091` 完成真实插件树加载，HTTP 返回 `200 OK`。
- 合成测试覆盖缺少必填参数、默认双系统、显式单八字、真太阳时缺经度、Observation 与 Cordis 单次注册。
- 未使用真实生日、未接入网络排盘、未提交或 push。

## 用户验收点

- 按 `docs/develop/dsh-local-test-sop.md` 验证 Agent 补问、Tool 参数和 Observation。
- 重点 review Tool Schema、Adapter 映射、Executor 路由、三个 unavailable 引擎与 Observation 投影。
- 用户确认本切片后，再进入 Tyme Provider 探针；不提前实现真实八字。
