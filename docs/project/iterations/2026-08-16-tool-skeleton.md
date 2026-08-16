# 迭代记录：Tool 切片 0 内部骨架

- 日期：2026-08-16
- 分支：`feat/tool-skeleton`
- 状态：实现完成，等待用户审核公共契约

## 目标

依据 DSH 官方插件开发与分发资料，把 v0.1.0 技术方案补成可执行交付链；先建立不会锁死公共 Tool Schema 的 TypeScript 内部骨架，后续优先纵向完成八字，紫微未交付期间不得生成预设命盘。

## 官方核验

- 插件使用函数 `apply(ctx)`，消费 Tool registry 时声明 `inject = ['tools']`。
- `defineTool.parameters` 校验模型参数，`execute()` 返回 `output.schema` 声明的 canonical JSON，`output.render()` 纯投影模型内容。
- 本地源码用绝对入口 overlay 配合 `dsh web --patch` 调试。
- `dsh.bundle` 是 `package.json` manifest，指向包内 `cordis.patch.yml`。
- tarball 安装后先用 `dsh --profile <name> --dump-config` 检查组合层，再启动 Profile。
- GitHub 源码安装需要自包含 `prepare` 与 pnpm `allowBuilds` 授权；v0.1.0 先用预构建 tarball 作为发布候选证据。

精确 revision 与官方链接记录在 develop 技术方案的“DSH 官方依据”中。

## 实际改动

- 技术方案新增 DSH 官方证据矩阵、源码调试闭环、Bundle/Profile/tarball 交付闭环和分发差异。
- 实现顺序调整为 Schema/DSH 骨架之后优先完成八字，再定义阶段性紫微未交付行为，最后实现紫微。
- Tool 契约收窄首版输入提案，暂缓 `include`、`referenceDate` 和 `locale`。
- 新增框架无关的出生时间显式联合、系统枚举、逐能力 outcome 和取消上下文。
- 新增八字、紫微、时间能力端口及其待审核模型。
- 新增原子能力输入输出审核稿，把共享出生、时间、八字、紫微、outcome 与 Executor 分开供用户逐项拍板。
- 新增唯一 `FateChartExecutor`，顺序路由已归一化的系统请求；未经 Provider 隔离证据不并发。
- 新增 `UnavailableZiweiEngine`，只返回内部未实现 outcome，不产生任何紫微命盘字段。
- `src/index.ts` 继续不注册 Tool，避免未经用户审核的 Schema 成为运行时接口。

## 本轮边界

- 未安装 DSH、Cordis、Tyme、iztro 或太阳时依赖。
- 未创建 `defineTool`、Cordis Config、开发 overlay、bundle manifest 或 `cordis.patch.yml`。
- 未冻结 Tool Schema、canonical 状态、错误码和 Observation 文案。
- 未实现八字、紫微或太阳时真实计算。
- 未修改 README，未使用真实生日，未 commit、push、Tag、Release 或发布。

## 等待用户审核

- Tool input 是否采用显式公历／农历日期、显式已知／未知时间、地点、性别、systems、conventions 和可选 subject。
- 首版是否确认暂缓 `include`、`referenceDate` 和 `locale`。
- 紫微未实现期间，仅紫微请求是否返回 `unsupported`，双系统请求是否返回 `partial`。
- `NormalizedBirth`、八字、紫微和时间能力的输入输出边界是否符合业务理解。
- 审核通过后是否进入 DSH 依赖安装与 `defineTool` + `--patch` 切片。

## 验证证据

- Node.js `24.19.0`、pnpm `11.7.0`：格式、Lint、类型、5 项测试、离线测试与构建通过。
- Node.js `22.19.0`、pnpm `11.7.0`：最低兼容类型、5 项测试与构建通过。
- `git diff --check` 通过。
- 32 个 Markdown 文件的相对链接目标全部存在。
- 私人绝对路径、私人规划文件名、Obsidian embed 和任务链接扫描无命中。
- `package.json`、`pnpm-lock.yaml`、根 README、第三方声明和 bundle manifest 零变化，证明本轮没有偷装依赖或提前声明可安装插件。
- 公共测试只使用 `2000-01-02`、未知时辰和 `Synthetic City` 等人工构造值。
