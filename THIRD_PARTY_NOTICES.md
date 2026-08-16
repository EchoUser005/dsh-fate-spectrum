# 第三方软件声明

Tyme 已作为八字 Provider 接入运行时引擎，iztro 已作为紫微 Provider 接入运行时引擎。以下直接依赖已锁定在 `pnpm-lock.yaml`；DSH Tool 与 Cordis 作为插件 peer dependency 使用，DSH CLI 只用于本地 Profile 验证。

| 软件包                   | 版本       | 许可证     | 用途                           |
| ------------------------ | ---------- | ---------- | ------------------------------ |
| `typescript`             | 6.0.3      | Apache-2.0 | 类型检查                       |
| `@types/node`            | 22.20.0    | MIT        | Node.js 类型声明               |
| `tsdown`                 | 0.22.2     | MIT        | ESM 包构建                     |
| `vitest`                 | 4.1.8      | MIT        | 测试                           |
| `oxlint`                 | 1.76.0     | MIT        | 静态检查                       |
| `prettier`               | 3.9.6      | MIT        | 格式化                         |
| `@deepseek-ai/dsh`       | 0.1.0-rc.6 | MIT        | 本地 Profile 与 `--patch` 验证 |
| `@deepseek-ai/dsh-tools` | 0.1.0-rc.6 | MIT        | Tool Schema、注册与执行契约    |
| `@deepseek-ai/cordis`    | 4.0.1      | MIT        | 插件生命周期与 Context 类型    |
| `tyme4ts`                | 1.5.2      | MIT        | 离线历法与八字 Provider        |
| `iztro`                  | 2.5.8      | MIT        | 离线紫微斗数 Provider          |

DSH 发布线的生命周期脚本白名单依据其官方 `pnpm-workspace.yaml` 复核后写入本仓库。增加命理 Provider 或升级 DSH 前，必须同步记录固定版本、许可证、用途和必要署名，并完成许可证审查。
