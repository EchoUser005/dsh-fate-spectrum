# v0.1.0 原子能力输入输出审核稿

- 状态：共享输入、八字与紫微基础字段、默认规则及未知时辰候选已确认并接入；完整视太阳时地点来源仍待后续审核
- 对应技术方案：[`calculate-fate-chart-v0.1.0.md`](calculate-fate-chart-v0.1.0.md)
- Tool 契约：[`../tool-layer.md`](../tool-layer.md)

本文只定义业务层应该知道什么、返回什么，不决定 DSH Schema 语法，也不复制 Tyme/iztro 的第三方对象。字段经用户确认并通过 Provider 探针后，才从 Draft 进入正式领域模型。

## 1. 边界顺序

```text
模型参数
  -> DSH Schema 校验
  -> Adapter 映射
  -> NormalizedBirth + ResolvedConventions
  -> 时间 / 八字 / 紫微原子能力输入
  -> 各自领域结果
  -> FateChartExecutor 组合逐系统 outcome
  -> canonical Tool result
```

`name`、`relation` 不进入 v0.1.0 Tool Schema 或任何计算输入。Provider 原始类、枚举、异常和全局设置停在 Provider 边界，不进入领域结果。

## 2. 共享出生输入

### 2.1 当前代码 Draft

```ts
type BirthCalendarDate =
  | { calendar: 'gregorian'; year: number; month: number; day: number }
  | { calendar: 'lunar'; year: number; month: number; day: number; leapMonth: boolean }

type BirthClockTime = { status: 'known'; hour: number; minute: number } | { status: 'unknown' }

interface NormalizedBirth {
  date: BirthCalendarDate
  time: BirthClockTime
  gender: 'male' | 'female'
  location: {
    timeZone: string
    longitudeDegrees?: number
    latitudeDegrees?: number
    label?: string
  }
}
```

### 2.2 判断逻辑

- 日期拆成整数，避免每个 Provider 重复解析字符串。
- 农历闰月显式表达，不能从模糊文本猜测。
- 未知时辰是独立分支，任何层都无法把它当作 `00:00`。
- Executor 只接收已经归一化的 IANA timezone；地点文本解析失败应在 Adapter 阶段形成可修复结果。
- 经度用于视太阳时；纬度是否是本版必要计算量，在太阳时探针后确认。即使不参与公式，也可作为地点精度来源，但不能因为“以后可能用”强制用户提供。

### 2.3 已确认与待确认

- 已确认首版开放公历／农历，日期与闰月显式表达。
- 已知时间使用小时、分钟；未知时间使用独立 `unknown` 分支。
- `gender` 使用稳定英文值 `male | female`，Schema description 使用中文解释。
- 已确认首版地点交互接受城市、区县，不要求普通用户理解经纬度；仍待确定离线地点数据源、坐标映射和 timezone 修复行为。

## 3. 时间计算能力

### 3.1 输入提案

```ts
interface TimeCalculationInput {
  birth: NormalizedBirth
  mode: 'civil' | 'apparent'
}
```

Provider 探针后可能增加、但不能提前默认的规则：时区历史数据库版本、均时差算法、经度基准、跨日后的换日规则。

### 3.2 输出提案

```ts
type ResolvedCalculationTime =
  | {
      status: 'known'
      inputCivilTime: LocalDateTime
      calculationTime: LocalDateTime
      timezone: string
      utcOffsetMinutes: number
      longitudeDegrees?: number
      longitudeCorrectionSeconds?: number
      equationOfTimeSeconds?: number
      totalCorrectionSeconds?: number
      crossedCivilDate: boolean
      mode: 'civil' | 'apparent'
      provenance: CalculationProvenance
    }
  | {
      status: 'unknown'
      timezone: string
      mode: 'civil' | 'apparent'
      provenance: CalculationProvenance
    }
```

未知时辰时不能产生伪造的 `calculationTime`；哪些只依赖日期／地点的来源字段仍可返回，需要探针后确认。

### 3.3 已确认与待确认

- 公共 Tool 使用 `civil | apparent_solar`；Adapter 可把 `apparent_solar` 映射为领域内部的 `apparent`。
- 结果披露民用输入时刻、实际排盘时刻、经度修正、均时差、总修正、是否跨日和来源。
- 已确认先完成太阳时校准，再按实际排盘时间应用 23 点换日；跨过 23:00 或日期边界时产生 warning。
- 首版地点输入精度确认为城市／区县；仍待确认离线解析来源、坐标可信度和缺失地点的修复行为。

## 4. 八字计算能力

### 4.1 输入提案

```ts
interface BaziCalculationInput {
  birth: NormalizedBirth
  resolvedTime: ResolvedCalculationTime
  conventions: {
    dayBoundary: BaziDayBoundary
    luckStartVariant: BaziLuckStartVariant
  }
}
```

已确认默认：`dayBoundary = zi_hour_next_day`，`luckStartVariant = lunar_sect_1`。保留 `late_zi_same_day` 与其他 Tyme 起运算法作为显式选项，结果必须披露 `explicit | default` 来源。

### 4.2 输出分组提案

| 分组         | 计划字段                                | 约束                             |
| ------------ | --------------------------------------- | -------------------------------- |
| 历法锚点     | 实际排盘时间、公历／农历日期、节气位置  | 必须带来源与采用约定             |
| 四柱         | 年、月、日、时柱；每柱干、支            | 时辰未知时不得伪造时柱           |
| 柱内信息     | 藏干、十神、纳音、旬空                  | 使用稳定领域值，不透传 Tyme 对象 |
| 命局摘要事实 | 日主等可确定排盘标识                    | 不输出强弱、格局、喜忌等模型判断 |
| 起运         | 顺逆、起运时刻／年龄表达、采用规则      | 具体精度和表示方式待探针         |
| 大运         | 序号、干支、起止时间／年龄              | 不在本版扩展完整流年流月作用关系 |
| 来源         | Provider、版本、算法／规则 ID、warnings | 每次结果可追溯                   |

### 4.3 本版明确不属于八字输出

- 格局、旺衰、喜忌、职业、健康、婚恋或吉凶结论。
- 原局与大运、流年、流月、流日、时辰之间的完整干支作用结果。
- Provider 调试字段、对象序列化副本或中文长段落。

### 4.4 已确认与待确认

- 已确认藏干按本气／中气／余气顺序提供，并同时给出各藏干相对日主的十神。
- 已确认柱干十神、纳音、旬空、十二长生、起运和大运进入基础结果；神煞本版暂缓。
- 已确认大运 Observation 同时提供交运年份与周岁范围，避免把“6–15”误解为年份。
- Tyme 1.5.2 探针确认未知时辰不能简单视为“只缺时柱”：晚子时会影响日柱和交运信息，节气交接日还会影响年／月柱与大运序列。
- 用户已确认全日候选语义：枚举 1440 个民用分钟并压缩真正不同的年／月／日柱与大运候选，每个候选携带适用时间范围；时柱和时柱相关事实全部省略，模型按共同／条件事实分别解读。见 [ADR 0013](../project/decisions/0013-unknown-birth-time-candidates.md)。

## 5. 紫微计算能力

### 5.1 输入提案

```ts
interface ZiweiCalculationInput {
  birth: NormalizedBirth
  resolvedTime: ResolvedCalculationTime
  conventions: {
    school: ZiweiSchool
    leapMonthRule: ZiweiLeapMonthRule
  }
}
```

已冻结对外枚举：`school = standard | zhongzhou`，默认 `standard`；`leapMonthRule = split_at_day_15 | whole_leap_month`，默认 `split_at_day_15`。四化和亮度首版固定跟随 `iztro@2.5.8`，不作为模型参数。

### 5.2 输出分组提案

| 分组     | 计划字段                            | 约束                     |
| -------- | ----------------------------------- | ------------------------ |
| 命盘锚点 | 农历日期、时辰、采用流派与规则      | 未知时辰返回十三份候选盘 |
| 基本标识 | 命宫、身宫、命主、身主、五行局      | 使用稳定 ID + 中文显示名 |
| 十二宫   | 宫位 ID／名称、宫干支、是否命／身宫 | 必须恰好十二宫的不变量   |
| 星曜     | 星曜 ID／名称、类型、所在宫、亮度   | 不直接复用 iztro 对象    |
| 四化     | 化禄、化权、化科、化忌及规则来源    | 流派差异显式披露         |
| 大限     | 序号、起止年龄／时间、所在宫        | 不提前实现流年细盘       |
| 来源     | Provider、版本、规则 ID、warnings   | 每次结果可追溯           |

### 5.3 已确认规则

- 已确认未知时辰不拒绝计算：返回早子到晚子共十三份候选盘，模型分离共同事实和条件事实。
- 已确认十二宫、命身宫、命主身主、五行局、星曜、四化、亮度与大限进入首版基础事实。
- 十二宫使用稳定英文 ID；命宫与身宫锚点携带宫位 ID、宫干和宫支，供 Agent 定位并为未来 A2UI 重放。
- 星曜 ID 由所在宫位、类型和规范中文名组成，不使用数组位置。
- 通行安星法为默认，保留中州派显式选项；闰月十五日分界为默认，保留整个闰月按本月安宫的显式选项。
- 四化和亮度首版固定使用 `iztro@2.5.8` 自带数据，不在 Tool 中开放自定义表。
- 以上决定见 [ADR 0014](../project/decisions/0014-ziwei-v0-1-contract-and-defaults.md)。

## 6. 原子能力 outcome

当前内部骨架使用：

```ts
type CalculationOutcome<T> =
  { ok: true; value: T; warnings: CalculationWarning[] } | { ok: false; error: CalculationFailure }

type CalculationFailureCategory = 'invalid_input' | 'unsupported' | 'provider'
```

判断原则：

- 可预期输入、能力或 Provider 失败作为值返回，Executor 才能组合双系统结果。
- 输出不变量破坏、程序错误和非预期基础设施异常直接抛出。
- `cause`、第三方异常文本和出生输入副本不能进入可公开 outcome。
- 紫微真实 Provider 成功时返回候选盘；非法农历／闰月返回可修复 outcome。Provider 输出破坏十二宫、命身宫、候选数量或稳定 ID 不变量时直接抛出。

## 7. Executor 输入输出

`FateChartExecutor` 输入是已归一化出生信息与非空、无重复的系统列表。它不接收 DSH args、name/relation 或 Provider 配置。

当前输出只保留：

```ts
interface FateChartExecutionResult {
  requestedSystems: FateSystem[]
  systemOutcomes: Array<BaziSystemOutcome | ZiweiSystemOutcome>
}
```

这不是公共 canonical result。顶层 `success | partial | needs_clarification | unsupported`、公开错误字段和 Observation 必须在用户审核 Tool 契约后由 Adapter/组合器实现。

## 8. 建议审核顺序

1. 先确认共享出生输入，特别是未知时辰与地点边界。
2. 再确认时间能力输入输出；换日和太阳时默认值仍留待探针。
3. 详细确认八字字段，随后进入 Tyme 探针和八字纵向实现。
4. 先确认紫微未完成时的公共行为；紫微完整字段可在八字交付后结合 iztro 探针复审。
5. 最后把已确认领域边界映射为 DSH Tool Schema 与 canonical output。
