# Tool 层设计

> 本文是 Tool 契约、执行、失败和 Observation 的专项真相源，修改 Tool 前必须先更新本文或明确说明为何不影响本文。

- 状态：v0.1.0 首版输入已落为 DSH Schema，Tool 已在本地 Profile 注册；`0.1.0-dev.3` 已公开真实八字／紫微 `success`、默认双系统成功、两套未知时辰候选、可修复输入与安全 `partial`。完整视太阳时继续按独立切片冻结。

## 1. 为什么单独设计这一层

命理计算库、Agent Tool 与模型上下文有不同的消费者和失败语义，不能共用一个“返回大 JSON”的接口。

本项目把一次 Tool 调用拆成五个明确步骤：

```mermaid
flowchart LR
    Schema[Model-visible Tool Schema] --> Execute[DSH Tool execute]
    Execute --> Executor[Task-specific Executor]
    Executor --> Engines[Atomic Capability Engines]
    Engines --> Domain[Rich Domain Result]
    Domain --> Canonical[Canonical Tool Result]
    Canonical --> Render[ObservationAssembler]
    Render --> Model[Model-visible Observation]
```

核心约束：

- Tool Schema 告诉模型“何时以及如何调用”。
- Domain Result 表达计算系统知道的完整事实。
- Canonical Tool Result 是稳定、精选、可编程的 JSON。
- Observation 告诉模型“这次发生了什么以及下一步怎么做”。
- Presentation DTO 告诉 UI“怎么画”，它不是 Observation。

## 2. 模型可见 Tool 边界

v0.1.0 只注册排盘 Tool：

```text
calculate_fate_chart
```

它代表一个用户任务，而不是一个底层算法。`systems` 由唯一的 `FateChartExecutor` 解释，决定调用八字、紫微或两套原子计算引擎：

```ts
type FateSystem = 'bazi' | 'ziwei'

interface CalculateFateChartInput {
  birth: BirthInput
  gender: 'male' | 'female'
  systems?: FateSystem[]
  conventions?: FateConventionInput
}
```

`systems` 未提供时默认解析为 `['bazi', 'ziwei']`。默认值只能由 Executor 调用的具名约定解析器产生，不允许散落在分支或 Provider 内部。

首个可运行 Schema 不包含 `include`、`referenceDate` 或 `locale`。渐进披露与本地化只有在基础排盘链路出现真实需求后再审核；时间范围由后续独立干支历 Tool 承担，不向排盘 Tool 追加 `referenceDate`。

插件长期不受“只能有一个 Tool”限制。后续会为“下周／下下周／明确日期范围转干支历”注册独立模型可见 Tool，由独立任务级 Executor 返回时间上下文。它不接收出生信息、不执行排盘，也不提供真太阳时校准。公共名称、Schema 与交付版本在该能力里程碑单独冻结。

典型周报任务由 DSH Agent 和 Skill 编排：

```text
消歧时间范围与出生资料
  -> 干支历 Tool：确定日期、流年、流月和逐日干支
  -> calculate_fate_chart：取得八字／紫微命盘事实
  -> 周报 Skill：组合分析步骤与输出要求
  -> A2UI（后续）：消费稳定 Presentation DTO
```

不为以下内部能力注册模型 Tool：

- `normalizeBirthInput`。
- `calculateBazi`。
- `calculateZiwei`。
- 藏干、十神等字段转换。
- Provider 诊断与规则表查询。

这些是应用或领域能力，不需要占用模型工具选择空间。

## 3. 输入契约

### 3.1 必需语义

- `birth.date`：年、月、日三个整数；农历分支额外显式提供闰月标志，不让 Provider 解析自然语言日期。
- `birth.time`：支持明确时间或明确的未知状态，不能把未知时辰默认为 `00:00`。未知时辰返回覆盖全天的合法候选盘，省略全部时柱相关事实，见 ADR 0013。
- `birth.calendar`：`gregorian | lunar`。
- `gender`：使用可读枚举。

时间提案使用可判别联合：

```ts
type BirthTimeInput = { status: 'known'; hour: number; minute: number } | { status: 'unknown' }
```

`name`、`relation` 不进入 v0.1.0 模型 Schema。它们不影响计算，未来 Memory 场景如需加入，只能作为非计算元数据另行审核。

出生时辰未知仍是合法输入：八字返回覆盖全天的三柱候选，紫微返回早子至晚子十三份候选。Observation 必须保留条件边界，不得替用户选择唯一时辰。

### 3.2 地点与时间

地点输入按优先级解析：

1. 显式 IANA timezone + longitude/latitude。
2. 显式 timezone + longitude。
3. 离线地点解析结果。
4. 缺失时请求用户补充。

MVP 至少支持显式 IANA timezone 与 longitude。若尚未选定经过测试的离线 TypeScript 地点 Provider，`location.text` 只作为标签；仅给文本时返回 `needs_clarification`，不能联网查询或虚构坐标。

地点文本命中城市中心点时，provenance 必须标明 `city` 精度，不能伪装为区县或出生地点精确坐标。

真太阳时使用显式模式：

- `civil`：民用时。
- `apparent_solar`：完整视太阳时校正。

公共 Schema 不再使用含义模糊的 `useTrueSolarTime: boolean`。领域内部可把 `apparent_solar` 映射为简短的 `apparent` 枚举，但不能改变对外语义。

### 3.3 计算约定

Tool 输入允许显式选择：

- `dayBoundary`。
- 起运规则 Provider/variant。
- 紫微安星流派与闰月设置。

默认值由单一 `resolveConventions()` 产生，并在结果中披露 `source: explicit | default`。

八字已确认默认值：

- `dayBoundary: zi_hour_next_day`：先完成真太阳时校准，再以实际排盘时间的 23:00 作为次日日柱起点。
- `luckStart: lunar_sect_1`。

保留 `late_zi_same_day` 和 Tyme 其他起运算法作为显式选项。真太阳时修正跨过 23:00 或日期边界时必须返回 warning。

紫微已确认默认值：

- `school: standard`：通行安星法；可显式选择 `zhongzhou`。
- `leapMonthRule: split_at_day_15`：闰月十五日分界；可显式选择 `whole_leap_month`。
- 四化和亮度固定使用 `iztro@2.5.8` 内置表，不作为 Tool 参数。

### 3.4 结果分区延后

八字原局、起运、大运、紫微十二宫与大限在 v0.1.0 先按用户批准的完整基础结构返回。`include` 暂不进入首个 Schema；等真实命盘验证显示模型上下文需要渐进披露时，再设计稳定 section 枚举。未知 section 的拒绝逻辑也不提前创建。

## 4. 领域结果

原子计算引擎返回的 Domain Result 追求完整与可验证；引擎背后的 Provider 只能通过领域端口参与，不能把第三方对象直接交给 Executor：

```ts
type DomainResult<T> =
  | { ok: true; value: T; warnings: DomainWarning[]; provenance: ProviderProvenance }
  | { ok: false; error: DomainError }
```

Domain Error 面向程序，不面向模型：

```ts
interface DomainError {
  code: DomainErrorCode
  category: 'validation' | 'ambiguity' | 'unsupported' | 'dependency'
  field?: string
  details?: JsonValue
  cause?: unknown
}
```

`cause` 不允许越过任务级 Executor 边界进入 Tool 结果、日志或 Observation。

## 5. 规范工具结果

DSH `execute()` 返回 canonical JSON。它是 Tool 的程序化 API，也是 Code Mode 调用得到的值。

当前运行时 `schemaVersion = 0.1.0-dev.3`。八字成功数据只来自 `tyme4ts@1.5.2`，紫微成功数据只来自 `iztro@2.5.8`；两者均离线计算，不使用人工命盘填充运行时成功分支。完整视太阳时未接入时仍返回明确状态。

```ts
type CalculateFateChartResult =
  | CalculateFateChartSuccess
  | CalculateFateChartNeedsClarification
  | CalculateFateChartUnsupported
  | CalculateFateChartPartial
```

### 5.1 完整成功

```ts
interface CalculateFateChartSuccess {
  status: 'success'
  schemaVersion: '0.1.0-dev.3'
  requestedSystems: FateSystem[]
  systems: Array<
    | { system: 'bazi'; status: 'success'; chart: BaziToolDto }
    | { system: 'ziwei'; status: 'success'; chart: ZiweiToolDto }
  >
}
```

`BaziToolDto` 包含历法锚点、时间精度、计算约定及来源、一个或多个候选盘。每个候选包含适用出生时段、日主、柱内事实、起运和八步大运。已知时辰只有一个四柱候选；未知时辰返回覆盖全天的三柱候选，省略全部时柱事实，详见 [ADR 0013](project/decisions/0013-unknown-birth-time-candidates.md)。

`ZiweiToolDto` 包含历法锚点、时间精度、安星／闰月约定及来源、一个或多个候选盘。每个候选包含适用出生时段、命身宫锚点、命主身主、五行局和恰好十二宫；每宫包含稳定宫位 ID、宫干支、命／身／来因标志、星曜 ID／名称／类型／亮度／四化和大限虚岁／干支。已知时辰只有一个候选；未知时辰返回十三个时辰槽候选，详见 [ADR 0014](project/decisions/0014-ziwei-v0-1-contract-and-defaults.md)。

调用相关性使用 DSH 自有 Tool Call 身份，不复制到领域或 canonical 结果中；这样相同输入、版本和约定可产生完全相同的 canonical 值。

### 5.2 可修复结果

```ts
interface CalculateFateChartNeedsClarification {
  status: 'needs_clarification'
  schemaVersion: '0.1.0-dev.3'
  requestedSystems: FateSystem[]
  error: {
    code: string
    retryable: true
    field: string
    repair: string
    candidates?: JsonValue[]
  }
}
```

模型看到该结果后应自然追问或修正参数，不需要依赖错误堆栈推理。

### 5.3 暂不支持

```ts
interface CalculateFateChartUnsupported {
  status: 'unsupported'
  schemaVersion: '0.1.0-dev.3'
  requestedSystems: FateSystem[]
  error: {
    code: string
    retryable: boolean
    field?: string
    repair?: string
  }
}
```

### 5.4 部分成功

当 `systems` 同时请求八字和紫微，一套成功而另一套发生可安全分类的 Provider 失败时，允许返回 `partial`。它必须列出成功和失败的系统，不能缺字段后仍标记 `success`。共享输入无效、输出不变量被破坏或基础设施异常不得转换为 `partial`。

真实双系统已接入后，默认请求在两套 Provider 都成功时返回 `success`。`partial` 只保留给一套成功、另一套发生可安全分类 Provider 失败的情况；成功系统保留完整命盘，失败系统携带结构化错误。八字或紫微内部的未知时辰候选都不是 `partial`。

## 6. DSH 执行契约

DSH Tool Adapter 遵守以下顺序：

1. DSH 根据 Tool Schema 校验模型参数。
2. Adapter 执行 schema 无法表达的非空、跨字段和语义校验，并映射成框架无关请求。
3. Adapter 调用唯一的 `FateChartExecutor`。
4. Executor 根据 `systems` 路由原子计算引擎并返回 canonical result。
5. DSH 根据 Output Schema 再次验证、快照并冻结结果。
6. `output.render()` 把结果转换为模型可见 ContentBlock。

示意：

```ts
defineTool({
  name: 'calculate_fate_chart',
  description: TOOL_DESCRIPTION,
  parameters: calculateFateChartParameters,
  output: {
    schema: calculateFateChartOutputSchema,
    render: renderCalculateFateChartObservation,
  },
  isConcurrencySafe: () => true,
  async execute(args, exec) {
    const request = mapCalculateFateChartRequest(args)
    return fateChartExecutor.execute(request, { signal: exec.signal })
  },
})
```

`isConcurrencySafe: true` 只有在全部 Provider 无共享可变状态、测试证明确认后才能开启；遗漏时走保守路径。

这与 Moya 的注册层／执行层分离是同一类边界：Moya Executor 返回工程 `ToolResult`，registry 将其翻译成模型 Observation；在 DSH 中，`FateChartExecutor` 返回 canonical value，`output.render()` 完成模型可见投影。Observation 不由八字或紫微引擎各自拼接。

## 7. Observation 组装器

### 7.1 职责

ObservationAssembler 是 `output.render()` 使用的纯函数，不是第二套全局 Context Engine。

输入：

- 已校验 Tool args。
- 已校验 canonical result。

输出：

- DSH ContentBlock 数组。

禁止：

- 调 Provider 重新计算。
- 查数据库、Session 或 Memory。
- 使用当前时间或随机数。
- 把失败升级/降级成另一种状态。
- 根据模型类型输出不同事实。

### 7.2 成功 Observation

成功 Observation 包含：

1. `status` 和已计算系统。
2. 本次请求需要的核心命盘事实。
3. 时间、地点和流派约定。
4. 重要 warnings。

年龄与年份不得写成容易混淆的裸区间。大运至少表达为：

```text
丙子大运：2004 年交运，6–15 周岁
丁丑大运：2014 年交运，16–25 周岁
```

它不包含：

- 完整 canonical JSON 的重复副本。
- 第三方原始对象。
- HTML 布局字段。
- 吉凶、职业、健康、婚恋断语。
- 与基础命盘无关的解释、案例或未来周期计算。

### 7.3 重试 Observation

可修复失败 Observation 应直接表达：

```text
无法排盘：出生地点存在歧义。
需要修复：location.timezone。
可选值：Asia/Shanghai、Asia/Hong_Kong。
下一步：向用户确认后，使用完整参数重试 calculate_fate_chart。
```

Observation 的文案可以本地化，但错误码和字段路径保持稳定。

### 7.4 后续渐进披露

首个 Schema 不提供 `include`。如果完整基础命盘在真实 Tool Loop 中证明确实过大，再为同一 Tool 设计无状态 section 枚举并由用户审核；在此之前不创建 section、缓存或占位返回。

任何版本都不使用：

- 进程全局 `chartCache`。
- 仅存在内存中的 `chartId`。
- 把整份命盘写入 Prompt Section。
- 让模型从之前的 Observation 反推缺失数据。

后续有持久 Session Event 后，`chartId` 才成为可靠的 UI/Focus 引用。

## 8. 错误分类

| 层          | 正常失败形式            | 目标                     | 示例                  |
| ----------- | ----------------------- | ------------------------ | --------------------- |
| Domain      | `DomainResult.error`    | 精确表达计算问题         | 日期越界、流派不支持  |
| Executor    | canonical failure union | 决定重试、追问、部分成功 | `needs_clarification` |
| DSH Adapter | throw / DSH `isError`   | 包住非预期执行失败       | 输出不变量被破坏      |
| Observation | 行动导向文本            | 帮助模型下一步           | 追问 timezone         |

稳定错误码初始集合：

- `INVALID_DATE`。
- `INVALID_LUNAR_DATE`。
- `UNKNOWN_BIRTH_TIME`。
- `AMBIGUOUS_LOCATION`。
- `UNSUPPORTED_TIMEZONE`。
- `INVALID_RULE_OPTION`。
- `BAZI_ENGINE_FAILURE`。
- `ZIWEI_ENGINE_FAILURE`。
- `INVALID_ENGINE_OUTPUT`。

错误码只增加或版本化变更，不随第三方异常消息变化。

干支历 Tool 的日期范围错误码不提前占用排盘 Tool 的错误命名空间；到对应里程碑再定义。

## 9. 提示词与工具描述

Tool description 只回答：

- 什么时候必须调用。
- Tool 能确定什么事实。
- 哪些字段缺失时应先追问。
- 不应用它做什么。

Prompt Section 补充跨 Tool 的事实纪律：

- 不自行计算或修改命盘事实。
- 不隐藏默认流派和时间校准。
- 分清计算事实、案例类比和模型解释。
- 高风险建议不得用命理结果替代专业判断。

不要把完整分析流程、案例库或动态用户信息放进 Tool description。

## 10. 展示层保持独立

DSH 普通 Tool Presentation 与未来高级命盘组件是两套投影：

- Tool `presentCall/presentResult`：MVP 可使用 generic card。
- `output.render()`：模型 Observation。
- `ChartViewModel`：未来命盘组件。
- `fate/chart-*` Session Event：未来可重放 UI 状态。
- `ConversationNodeDefinition`：未来 Web Chat 节点。

UI 不得从 Observation 文本解析四柱或星曜；模型也不需要看到所有 UI 坐标和视觉属性。

## 11. 隐私约束

- Tool 不记录姓名、生日、地点和完整结果。
- DSH Session 会记录原始 Tool 参数，因此生日可能随 Session 保留；插件不得创建第二份存储，用户文档必须说明由 DSH 配置控制 Session 保留/删除。
- 正常日志只记录匿名 request correlation、耗时、Provider 版本和状态码。
- Error 不包含输入副本。
- 公共 snapshot 对 birthday 字段使用 synthetic inputs，而不是脱敏后的真实生日。
- 私有人工案例不进入 Git、CI、issue、release artifact 或 telemetry。
- 未来 UI 事件只持久化重放所需数据，并在实现前单独完成隐私评审。

## 12. 验证要求

Tool 层至少包含：

- Input Schema accept/reject tests。
- Output Schema validation tests。
- 每个稳定错误码的契约测试。
- Observation snapshot tests。
- Provider 异常不泄漏测试。
- 100 次重复确定性测试。
- A/B 并发隔离测试。
- 禁网测试。
- DSH Profile 加载与真实模型 Tool Loop smoke。

Golden cases 必须是人工构造的边界盘，不能使用开发者个人生日。实现生成的输出不能作为同一实现的唯一真值。

## 13. 变更规则

修改下列任一内容必须同步更新本文、JSON Schema、类型和测试；只有已经验收的用户用法或能力发生变化时才更新 README：

- Tool 名称、描述或参数。
- canonical result 字段。
- 稳定错误码。
- 默认 conventions。
- Observation 的行动语义。

第三方 Provider 升级不应直接改变 Tool 契约；若计算事实变化，必须记录版本、差异和 golden 审核证据。

## 14. DSH 官方参考资料

- Tool tutorial: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/tool.md>
- Tool authoring: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md>
- Tool pipeline: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md>
- Architecture: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md>
