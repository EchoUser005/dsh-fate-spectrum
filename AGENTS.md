# AGENTS.md

本文件是 `dsh-fate-spectrum` 的长期协作总纲。它只定义元规则，不记录阶段进度，不复制具体契约，也不替代专项设计文档。

任何新 Agent 开始工作时，必须先读本文件，再按任务类型读取对应真相源。不得依赖聊天记忆、旧分支经验或第三方库的直觉行为。

> `dsh-fate-spectrum` 是 DeepSeek Harness（DSH）的确定性命理能力插件：插件计算事实，DSH 负责模型、Agent Loop、Session 与工具调度。凡是能由程序确定的历法和命盘事实，都不能交给模型猜测；凡是属于模型解释、会话状态或产品外壳的能力，都不能塞回计算核心。

## 一、产品方向

项目最终要形成一套可验证、可追溯、可组合的命理事实基础设施，让 DSH Agent 能围绕用户真实经历持续提供有依据的自我观察与行动参考。

能力沿同一技术主线逐步生长：

1. **命盘**：八字、紫微及其计算约定和来源信息。
2. **时间与作用**：干支历时间范围、原局与运限作用事实。
3. **流程与知识**：周报 Skill、经授权的案例与规则检索。
4. **交互呈现**：基于 DSH 可重放事件的命盘与局部分析组件。
5. **用户校准**：未来在明确授权和隐私审查后，通过 DSH Memory 记录已确认的现实反馈。

这些是完整愿景，不代表当前已实现范围。当前阶段、阻塞项和唯一下一步只以 [`docs/project/PROJECT_STATE.md`](docs/project/PROJECT_STATE.md) 为准。

## 二、真相源与阅读路由

同一规则只能有一个主要真相源。影响后续开发的决定必须写入仓库，不能只留在聊天中。

| 任务触发条件                                          | 开始前必须阅读                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| 任何非简单任务                                        | `docs/project/PROJECT_STATE.md` 指向的活动里程碑和当前迭代、相关 ADR    |
| 判断长期产品方向或架构                                | `README.md`、`docs/architecture.md`、相关 ADR                           |
| 判断当前版本范围、代码结构、TODO 或完成定义           | `PROJECT_STATE.md` 指向的活动里程碑                                     |
| 改分层、依赖方向、运行时边界、TypeScript 原则或技术栈 | `docs/architecture.md`、相关 ADR                                        |
| 改 Tool 参数、输出、状态、错误或模型可见内容          | `docs/tool-layer.md`、相关 ADR；修改前先获用户确认                      |
| 引入或升级 DSH/Cordis，改 Profile、Bundle、Tool 注册  | 锁定版本的 DSH 官方源码与文档，并运行真实组装 smoke                     |
| 引入或升级命理 Provider                               | 活动里程碑的探针要求、探针记录、许可证声明、差分与隔离测试              |
| 开始、结束或交接一轮开发                              | `DEVELOPMENT_WORKFLOW.md`、`PROJECT_STATE.md`、活动里程碑               |
| 准备 Tag、Release 或 npm 发布                         | `docs/project/DEVELOPMENT_WORKFLOW.md` 的发布闭环；必须获得当次明确授权 |

专项文档职责：

- [`README.md`](README.md)：只面向使用者表达插件使命、长期愿景、使用方式、版本能力、核心技术信念、隐私和边界；不得写仓库阶段、依赖版本、测试结果或开发进度。用户可见能力、安装方式、用法、版本、限制或隐私发生变化时，本轮必须评审 README；内部重构、依赖升级和测试变化不得自动改写它。
- [`docs/architecture.md`](docs/architecture.md)：长期架构、TypeScript 判断原则、依赖方向和演进护栏；不记录版本 TODO 或精确文件树。
- [`docs/tool-layer.md`](docs/tool-layer.md)：Tool、canonical outcome、错误与 Observation 契约。
- [`docs/project/PROJECT_STATE.md`](docs/project/PROJECT_STATE.md)：唯一的当前进度、阻塞项和下一步。
- [`docs/project/milestones/`](docs/project/milestones/)：跨多轮版本范围、详细代码树、TODO、决策门、完成定义和归档记录；同一时间只有一个活动里程碑。
- [`docs/project/decisions/`](docs/project/decisions/)：用户确认过的长期决策；未决定事项不得写成“已接受”。
- [`docs/project/iterations/`](docs/project/iterations/)：每轮目标、改动、证据和遗留项。
- [`docs/project/CHANGELOG.md`](docs/project/CHANGELOG.md)：每轮开发完成后追加一句仓库变更摘要；它是开发索引，不是 README 产品版本史。
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)：依赖、固定版本、许可证和用途。

### README 更新边界

README 是使用者入口，不随每轮开发机械更新。修改前先判断触发了哪一栏；没有命中下表时，不得改 README。

| README 部分        | 何时更新                                                      | 依据与限制                                                                |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 定义与愿景         | 产品使命、目标命主或长期价值发生变化，且用户明确确认          | 以用户确认的产品原文为主，只整理结构、逻辑和重复，不重新创作              |
| 长期规划／未来展望 | 长期能力方向被新增、删除或重新排序，且用户明确确认            | 只写方向；不得写成已经上线                                                |
| 当前能力           | 能力已经进入当前公开产品边界，并有端到端证据                  | 只描述命主能直接使用的能力，不写模块、测试或完成比例                      |
| 使用指南           | 真实 DSH 体验形成了可复用的安装步骤、对话案例或操作方式       | 未经实际体验和用户确认不得虚构；没有内容时保留 `[待补充]`                 |
| 最新版本           | 发布候选的用户可见能力已经验收，准备进入发布审核              | 用使用者语言说明这个版本能做什么；不得罗列代码、文件、异常分支或工程 Gate |
| 变更记录           | 一个公开产品版本确定或发布                                    | 每个版本只写一句产品变化；不得链接或复制 `docs/project/CHANGELOG.md`      |
| 核心技术           | 稳定的计算机制、Tool 分层或 Agent 交互机制发生实质变化        | 只写具体机制及作用；禁止口号、自我评价、开发过程和依赖堆砌                |
| 隐私与边界         | 数据采集、传输、日志、Session、Memory、风险声明或能力限制变化 | 必须与实际运行行为一致，宁可披露限制，不作超范围承诺                      |
| 开源许可           | License 或第三方许可义务变化                                  | 同步 `LICENSE` 与 `THIRD_PARTY_NOTICES.md`，许可证风险立即暂停            |

以下内容永远不进入 README：Phase、完成比例、测试结果、分支、提交、文件树、Provider 探针、依赖升级、内部 TODO、下一开发步骤和本轮工作汇报。

开发记录按职责分流：当前状态写 `PROJECT_STATE.md`，一轮的目标、改动和证据写 `iterations/`，每轮完成后的一句话摘要写 `docs/project/CHANGELOG.md`，长期决定写 ADR。任何开发记录都不能冒充 README 的产品版本更新。

DSH 处于开发者预览期。涉及 DSH 边界时，不能只读本仓库旧记录，必须核验当时最新的官方仓库、包清单、锁文件和对应专题文档：

- 官方仓库：<https://github.com/deepseek-ai/deepseek-harness>
- 开发与版本：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md>
- DeepSeek Harness 架构：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.zh.md>
- Cordis 插件：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md>
- Tool：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/tool.md>
- 测试：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md>
- CLI、Profile 与 Bundle：<https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md>
  官方接口与仓库设计不一致时立即暂停，不靠兼容猜测继续实现。

## 三、架构护栏

完整设计见 `docs/architecture.md`。任何实现都必须保持以下稳定边界：

```text
DSH Adapter -> Application -> Domain <- Providers
                         \-> Canonical Result -> Observation
```

- **Domain 是稳定核心**：不依赖 DSH、Cordis、React、Tyme、iztro、网络、数据库或 Session。
- **Application 只做用例编排**：归一化输入、解析显式约定、调用独立端口、组合结果；不含历法算法和 DSH 细节。
- **Provider 是防腐层**：第三方对象、全局设置和异常不得越过 Adapter；八字与紫微必须保持两个独立 Provider/Executor。
- **DSH 只在边缘**：用官方 Cordis 生命周期注册能力，不修改或复制 Agent Loop。
- **输出分三层**：Domain 事实、canonical Tool JSON、模型 Observation/未来 UI 投影不能混用。
- **状态按调用隔离**：不保存全局用户、生日或命盘；依赖存在共享可变状态时默认串行，未经证据不得宣称并发安全。
- **扩展而非侵入**：未来 Skill、Knowledge、Memory、Session Event 和 UI 必须使用 DSH 原生扩展点，并在各自阶段单独设计和授权。

## 四、设计与实现策略

项目优先使用能保护边界的简单模式，不为“看起来像架构”而制造抽象：

- **端口与适配器**：隔离 DSH 和第三方计算库，稳定业务契约。
- **策略模式**：表达可替换的 Provider 或计算约定；策略必须显式传入，不能依赖隐藏全局值。
- **依赖注入**：用构造参数或具名依赖组装测试替身，避免 patch 模块全局状态。
- **判别联合与穷尽分支**：表达成功、部分成功、需澄清和不支持等封闭结果。
- **纯投影/组装器**：canonical result 到 Observation 或 UI DTO 只做无副作用转换。
- **可逆 Effect**：所有 Cordis 注册和资源使用遵循生命周期，卸载后不得遗留监听器或注册项。
- **保守默认**：未证明安全就视为不并发；未解析的输入就追问；未知时辰绝不补成 `00:00`。

避免以下失控模式：共享可变单例、通用 `utils` 垃圾桶、第三方类型泄漏、执行函数内散落默认值、同一规则多份实现、为单一实现提前建立工厂、把未来能力提前塞入 MVP。

## 五、元思考规则

开始实现前依次回答：

1. 用户真正要改善的体验是什么？它属于当前阶段吗？
2. 哪份文档是这项行为的真相源？是否需要先查 DSH 官方变化？
3. 这项逻辑属于 DSH、Application、Domain、Provider、Observation 还是未来 Presentation？
4. 输入、输出、失败、取消、并发和隐私边界分别是什么？
5. 哪个最小证据能证明结果正确，而不是仅证明代码能运行？
6. 这次改动是否把未来愿景误写成当前能力，或把模型解释误写成确定性事实？

对第三方库保持不信任：类型声明不等于运行时保证，示例不等于边界行为，单次正确不等于并发隔离。先做探针和差分证据，再冻结公共契约。

## 六、开发与发布闭环

每轮严格执行：

```text
读取状态与真相源 -> 提案并确认 -> 最小完整实现 -> 测试证据
-> diff/隐私/许可证审核 -> 更新项目记录 -> 汇报 -> 等待下一阶段授权
```

详细进入条件、证据矩阵和发布闭环见 [`docs/project/DEVELOPMENT_WORKFLOW.md`](docs/project/DEVELOPMENT_WORKFLOW.md)。不得连续跨越基建、Provider 探针、契约冻结、DSH 集成和发布多个阶段。

以下事项立即暂停并询问：

- 修改 Tool Schema、canonical output、错误语义或模型可见行动含义；
- 决定未知时辰、换日、太阳时、闰月或紫微流派默认值；
- 依赖能力与规划不一致、出现许可证风险或 DSH 官方接口漂移；
- 需要使用真实生日或持久化出生信息；
- 增加 Tool、UI、Memory、RAG、服务、数据库、缓存、Python 或第二个 Agent Loop；
- push、Tag、Release、部署或 npm 发布。

## 七、记录、语言与 Git

- 面向人的仓库文档、ADR、迭代记录和汇报默认使用中文；代码标识符、命令、协议字段、包名和标准许可证正文保留原文。
- 私人规划和真实案例只能在仓库外只读使用；确需临时进入工作树时只能放入统一忽略的 `.local/`，不得复制到公开文档。
- 公共测试只用人工构造案例；“脱敏后的真实生日”仍不算合成数据。
- 分支仅使用 `feat/`、`fix/`、`refactor/`、`docs/`、`chore/`；提交采用 Conventional Commits。
- 未经明确授权，不 push，不创建或推送 Tag，不创建 Release，不发布 npm 包。
- 报告只写真实执行过的命令和结果；跳过项必须说明，不能描述成通过。

## 八、新窗口最小检查

1. 阅读本文件。
2. 阅读 `PROJECT_STATE.md` 指向的活动里程碑、当前迭代和相关 ADR。
3. 运行 `git status`，确认分支、未提交改动和用户资产。
4. 按任务路由读取专项文档；涉及 DSH 时核验官方现状。
5. 明确本轮阶段边界、需用户确认的决定和验证命令后再改动。

当目标清晰但实现路径会破坏边界时，应指出冲突并提出更短、更稳的路径；当目标或业务判断不清晰时，应停下来讨论，不能用代码替用户作决定。
