# ADR 0012：首个 Tool 切片锁定 DSH rc.6 发布线

- 状态：已接受
- 日期：2026-08-16

## 背景

开始 `defineTool` 纵向切片时，DSH 主仓库 `master` 的根 `package.json` 仍显示 `0.1.0-rc.5`，但 npm 已不提供同版本 `@deepseek-ai/dsh-tools`；官方 npm 的最新完整同版本发布线是 `0.1.0-rc.6`。

混用主仓库 `rc.5` 源码与 npm `rc.6` CLI/Tool 包会让类型、运行时和 Profile 证据失去对应关系。实际可安装发布物比未同步的主分支清单更适合作为本地交付基线，但仍需逐项核验官方接口。

## 决定

- 本切片锁定 `@deepseek-ai/dsh@0.1.0-rc.6`、`@deepseek-ai/dsh-tools@0.1.0-rc.6` 与 `@deepseek-ai/cordis@4.0.1`。
- `dsh-tools` 与 Cordis 同时作为精确 peer dependency 和本地开发依赖；插件不得打包第二份 DSH 运行时。
- DSH CLI 只用于本地 Profile 验证，不成为插件运行时依赖。
- 生命周期脚本白名单沿用 DSH 官方 `pnpm-workspace.yaml` 的判断：允许 `node-pty`、`koffi` 与 DSH subprocess 本机组件；拒绝不需要的 Google SDK 与 protobuf 生成脚本。
- 当前 npm `rc.6` 使用 `dsh --profile web --patch ...`；人工 SOP 以实际发布包行为为准。

## 影响

- Source-level API、类型检查、Profile 组装和用户 SOP 都对应同一发布线。
- DSH 升级必须重新核验 `defineTool`、Schema、`output.render()`、CLI 参数和真实加载 smoke，不能只改版本号。
- 主仓库与 npm 再次出现不可解释的接口差异时立即暂停。

## 官方依据

- [DSH package.json](https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json)
- [Tool 开发文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/tool.zh.md)
- [Tool 编写参考](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.zh.md)
- [CLI 文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.zh.md)
