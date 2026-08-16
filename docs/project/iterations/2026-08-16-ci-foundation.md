# 迭代记录：GitHub CI 与合并门禁

- 日期：2026-08-16
- 分支：`chore/ci-foundation`
- 状态：本地验证通过，待 GitHub Actions

## 目标

为仓库建立可重复的 GitHub Actions 质量门禁、统一 PR 审核入口和所有者／外部贡献者不同的合并授权边界。

## 明确不做

- 不改 README、Tool Schema、canonical output、错误语义或命理默认值。
- 不安装 DSH、Cordis、tyme4ts 或 iztro。
- 不实现 Provider、Executor、计算引擎或 DSH Adapter。
- 不创建 Tag、Release，也不发布 npm 包。

## 实际改动

- 新增 Node.js 24 完整质量门禁和 Node.js 22.19 最低兼容门禁。
- 新增外部 PR 必须取得 `owner-approved` 标签的合并策略检查。
- 新增中文 PR 模板，并把 GitHub 协作规则写入开发流程和 ADR。
- Phase 0 已通过 PR #1 squash merge 到 `main`。

## 验证证据

| 环境／命令                                                                                           | 结果                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Node.js `24.19.0`、pnpm `11.7.0`：锁定安装、格式、Lint、类型、测试、离线测试、构建、打包、diff check | 通过；1 个合成测试，tarball 内容符合基线   |
| Node.js `22.19.0`、pnpm `11.7.0`：锁定安装、类型、测试、构建                                         | 通过；最低官方兼容线可运行                 |
| 私人路径、规划文件名和疑似真实生日扫描                                                               | 通过；仅命中规则本身对“真实生日”的禁止说明 |
| GitHub Actions                                                                                       | 待本 PR 首次真实运行                       |
| `main` 规则集与仓库合并偏好                                                                          | 待 CI 上下文创建后配置                     |

## 下一步

CI 真实运行通过后，启用 `main` 规则集、squash-only、自动删除分支和仓库 auto-merge；随后进入已授权的 v0.1.0 文档设计轮。
