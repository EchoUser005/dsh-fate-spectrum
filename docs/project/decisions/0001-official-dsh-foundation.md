# ADR 0001：DSH 官方基建基线

- 状态：已接受
- 确认日期：2026-08-16

## 背景

DeepSeek Harness 仍处于开发者预览期。引入任何 DSH import 前，项目需要明确且可复现的运行时和包基线。

## 决定

- 支持官方 Node.js 范围 `^22.19.0 || >=24.0.0`。
- 本地开发基线通过 `.node-version` 固定为 Node.js `24.19.0`；较低兼容下限只有经过独立 smoke 后才可对外声明。
- 通过包清单固定 `pnpm@11.7.0`。
- 使用 ESM 和 `"type": "module"`。
- 基建工具链对齐 DSH 官方仓库：TypeScript `6.0.3`、`@types/node` `22.20.0`、tsdown `0.22.2`、Vitest `4.1.8`、Oxlint `1.76.0`。
- 本仓库额外使用 Prettier `3.9.6` 进行纯格式化。
- DSH import 只允许出现在 Adapter 边界。
- DSH 依赖安装推迟到集成阶段；届时必须核验官方源码与发布通道，并用真实 Profile smoke 验证选定版本。

## 影响

Phase 0 可以建立文档和 TypeScript 基线，但不能宣称已经兼容 DSH。任何兼容性声明都必须点名并验证精确 DSH 版本。
