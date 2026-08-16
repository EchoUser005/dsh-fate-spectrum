# 项目状态

最后更新：2026-08-16

## 当前阶段

Phase 0 与 GitHub CI 基建已分别通过 PR #1、PR #2 合并到 `main`。当前在 `feat/tool-skeleton` 上完成 Tyme 1.5.2 八字与 iztro 2.5.8 紫微运行时切片。`calculate_fate_chart` 的默认双系统、显式仅八字和显式仅紫微均已接入真实离线 Provider；紫微未知时辰返回覆盖全天的十三份候选盘。完整视太阳时、Bundle/tarball 和发布候选仍未完成。

## 活动导航

- 活动里程碑：[`milestones/v0.1.0.md`](milestones/v0.1.0.md)
- 开发技术方案：[`../develop/calculate-fate-chart-v0.1.0.md`](../develop/calculate-fate-chart-v0.1.0.md)
- 原子能力审核稿：[`../develop/fate-chart-capability-contracts-v0.1.0.md`](../develop/fate-chart-capability-contracts-v0.1.0.md)
- 人工测试 SOP：[`../develop/dsh-local-test-sop.md`](../develop/dsh-local-test-sop.md)
- 当前迭代：[`iterations/2026-08-16-iztro-ziwei-runtime.md`](iterations/2026-08-16-iztro-ziwei-runtime.md)
- Tyme 探针：[`../develop/tyme-bazi-provider-probe-1.5.2.md`](../develop/tyme-bazi-provider-probe-1.5.2.md)
- iztro 探针：[`../develop/iztro-ziwei-provider-probe-2.5.8.md`](../develop/iztro-ziwei-provider-probe-2.5.8.md)
- 长期架构：[`../architecture.md`](../architecture.md)
- Tool 契约：[`../tool-layer.md`](../tool-layer.md)

## 已确认基线

- Node.js：官方兼容范围为 `^22.19.0 || >=24.0.0`；本地开发基线固定为 `24.19.0`。
- 包管理器：`pnpm@11.7.0`。
- 包格式：ESM，声明 `"type": "module"`。
- DSH 本地集成锁定 `@deepseek-ai/dsh@0.1.0-rc.6`、`@deepseek-ai/dsh-tools@0.1.0-rc.6` 与 `@deepseek-ai/cordis@4.0.1`；Tyme 1.5.2 与 iztro 2.5.8 已分别作为八字、紫微 Provider 接入。
- 面向人的文档、ADR、迭代记录和汇报默认使用中文。
- `AGENTS.md` 只承载长期元指引；当前进度只在本文件维护。
- 公共测试只使用人工构造数据，私人规划和 fixture 不进入 Git。

## 已完成

- Phase 0 已通过 PR #1 squash merge 到 `main`。
- GitHub CI、PR 模板和 `main` 合并门禁已通过 PR #2 auto-merge 到 `main`。
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
- 新增 `v0.1.0` 活动里程碑，当前已进一步收束为用户功能目标、验收节点、决策门和完成定义；详细代码树进入 develop 技术方案。
- 用户已纠正正式开发主轴：一个排盘 Executor 根据 Tool 参数路由到原子能力目录中的八字、紫微计算引擎；具体分层、Schema 与 Observation 边界留待下一轮先确认理解，不在 Phase 0 擅自落地。
- 用户进一步确认插件长期允许多个模型可见 Tool：排盘与干支时间范围是两个独立任务；v0.1.0 仍只交付排盘，后续干支历 Tool 进入独立里程碑。
- `calculate_fate_chart` 首版输入、八字基础 response 和 Observation 方向已通过审核；神煞暂缓，大运 Observation 必须同时表达交运年份与周岁范围。
- 八字时间模式当前默认使用民用时；未来显式启用真太阳时时，先完成校准，再按实际排盘时间在 23:00 换日。起运默认采用 `lunar_sect_1`，其他流派保留显式选项。

## 当前切片结果

- 里程碑只保留用户功能目标、版本范围、验收节点和完成定义。
- `docs/develop/calculate-fate-chart-v0.1.0.md` 已按 DSH 官方资料补齐 `--patch`、Bundle、Profile、`--dump-config`、tarball 与分发链，并承载代码树、文件职责、实现切片和分层测试。
- 一个 `FateChartExecutor` 路由八字、紫微和共享时间能力；Tyme/iztro 是原子引擎背后的 Provider。
- DSH Tool 注册对应 Moya registry，`FateChartExecutor` 对应排盘工程 Executor，`output.render()` 对应 Observation 翻译层；未来干支历 Tool 使用独立 Executor，不与排盘 Executor 合并。
- DSH Adapter、嵌套参数 Schema、请求 mapper、开发期 canonical mapper 与纯 Observation projector 已建立。
- 一个 `FateChartExecutor` 先执行共享出生时刻能力，再按 `systems` 精确路由八字／紫微引擎；民用时基线仅无损透传，完整视太阳时明确未交付。
- 当前 `0.1.0-dev.3` output schema 暴露真实八字／紫微 `success`、默认双系统 `success`、安全 Provider 失败的 `partial`、`needs_clarification` 与 `unsupported`；运行时成功结果不使用人工 fixture。
- `.local/dsh/cordis.dev.yml` 由脚本生成并统一忽略；实际指向构建后的 `lib/index.js`。
- 已按“Schema 与 `--patch` 骨架 → 八字 Provider → 阶段性紫微未交付语义 → 紫微 Provider → 真实双系统”完成纵向切片；下一步进入用户 DSH 验收与 Bundle/Profile 发布候选。
- Tyme 1.5.2 已通过合成探针验证四柱、藏干、十神、纳音、旬空、十二长生、起运、大运、重复确定性与 Provider 状态恢复。
- Tyme Provider 已隔离第三方对象和模块级换日／起运状态；已知时辰返回一个四柱候选和精确交运信息。
- 未知时辰枚举全天 1440 分钟，按年／月／日柱与离散大运事实压缩候选；每个候选携带适用时段与交运范围，省略全部时柱相关事实。
- iztro Provider 已隔离第三方对象与模块级配置；默认通行安星法、显式中州派、两种闰月规则和 A/B/A 恢复均有测试证据。
- 紫微已映射十二宫、命身宫锚点、命主身主、五行局、星曜、亮度、四化、大限，以及未知时辰十三候选；宫位和星曜使用稳定 ID。
- canonical mapper 已实现真实单／双系统成功、非法农历／闰月可修复结果和安全 Provider 失败 `partial`。
- Observation 已向模型展开八字柱内事实与大运，也展开紫微命身宫、四化、十二宫、星曜亮度和大限；两套未知时辰都要求按候选作条件式解读。
- README 已按真实能力补充双盘、候选盘、使用方式与核心计算分层，移除尚未交付的真太阳时承诺，并如实披露 DSH Session 数据边界。
- 长期 A2UI 方向已明确包含大运／流年长期走势、一年内周期曲线和关键时间窗口；具体曲线语义与组件契约只在独立 A2UI 里程碑开启。

## 待后续确认

- 用户在真实 DSH Web 中复核默认双系统、显式仅紫微和未知时辰十三候选的自然语言体验。
- 完整视太阳时的离线地点解析、经度修正、均时差来源与跨日行为；地点交互已确认接受城市／区县。
- 独立干支时间范围 Tool 的下一里程碑名称、Schema 和交付顺序；它用于消除周运任务中耗时且不稳定的 Web 干支历检索。
- A2UI 走势图的纵轴究竟表达工程计算出的作用强弱、Agent 分析结论，还是两层同时展示；该业务定义进入未来 A2UI 里程碑，不在 v0.1.0 提前拍板。
- Bundle manifest、tarball 安装与发布候选是否在用户完成本轮 DSH 体验验收后立即进入。

## 验证状态

Phase 0 已在 Node.js `24.19.0`、pnpm `11.7.0` 下通过本地基建验证。CI 基建轮已经取得本地和真实 GitHub Actions 证据：

- Node.js `24.19.0` 下的格式、Lint、类型、测试、离线测试、构建与打包；
- Node.js `22.19.0` 下的最低兼容类型、测试与构建；
- PR #2 的 `merge-policy`、`quality`、`node-22-compatibility` 三项检查通过；
- `main` 规则集已启用上述三项必需检查、PR、线性历史、对话解决、禁止强推和禁止删除；
- 仓库已设为 squash-only、允许 auto-merge、合并后删除分支；外部 PR 必须取得 `owner-approved` 标签。

切片 1 已取得以下 DSH 组装证据：

- `--dump-config` 最后一层出现 `fate-spectrum -> lib/index.js`；
- 官方 Web Profile 完成真实 Cordis 插件树加载；
- `http://127.0.0.1:3091` 返回 `200 OK`；
- 27 项测试覆盖 DSH 缺参校验、默认／显式路由、真实八字／紫微 success、未知时辰全天候选、节气边界、农历闰月、流派 A/B/A、非法日期、真太阳时缺经度、Observation、Executor 共享时间短路和 Cordis 单次注册。
- Node.js 22.19.0 与 24.19.0 下的格式、Lint、类型、测试、离线测试和构建通过；冻结 lockfile 安装通过。

用户此前已在自己的 DSH 凭据环境中验证自然语言请求、结构化补问、`calculate_fate_chart` 调用和未交付 Observation。Tyme 探针与正式运行时另取得以下证据：

- `pnpm run probe:tyme` 通过；合成已知时辰案例重复 20 次结果唯一；
- 默认／晚子时换日和两种起运 Provider 均产生预期差异，A/B/A 状态恢复一致；
- 合成未知时辰普通日与节气日证明公共契约必须表达候选或澄清，不能填充默认时刻。
- 正式 Provider contract tests 证明已知字段映射、闰月正负月防腐、全天 1440 分钟完整覆盖、节气候选和 A/B/A 状态恢复。
- `0.1.0-dev.3` 结果通过 DSH output JSON Schema 校验；新构建经隔离 `DSH_HOME` 的 `--patch --dump-config` 出现 `fate-spectrum -> lib/index.js`。
- 隔离 DSH Web Profile 使用新构建在 `127.0.0.1:3092` 启动并返回 `200 OK`，验证后已关闭。

## 唯一下一步

用户按更新后的人工 SOP 在已有凭据的 DSH 中验收默认双系统、显式紫微和未知时辰十三候选。验收通过后，再确认进入 Bundle/tarball 发布候选切片，或先开启独立干支历 Tool 里程碑。
