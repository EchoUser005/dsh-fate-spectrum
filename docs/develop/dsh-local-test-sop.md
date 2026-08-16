# DSH 本地纵向切片人工测试 SOP

- 适用切片：`defineTool → FateChartExecutor → output.render()`
- DSH：`@deepseek-ai/dsh@0.1.0-rc.6`
- 当前结果：验证真实八字／紫微 `success`、默认双系统成功、两套未知时辰候选与模型 Observation；完整视太阳时尚未接入

## 1. 准备

在仓库根目录确认：

```sh
node --version
pnpm --version
```

本项目开发基线应为 Node.js `v24.19.0`、pnpm `11.7.0`。然后执行：

```sh
pnpm install
pnpm run dsh:prepare
```

第二条命令会构建 `lib/index.js`，再生成被 `.gitignore` 统一忽略的 `.local/dsh/cordis.dev.yml`。该文件只保存本机绝对入口，不提交。

## 2. 检查 Patch

不启动 Web 服务，先确认 DSH 能合并配置：

```sh
pnpm exec dsh --profile web \
  --patch "$PWD/.local/dsh/cordis.dev.yml" \
  --dump-config
```

输出末尾应出现：

```yaml
- id: fate-spectrum
  name: /绝对路径/dsh-fate-spectrum/lib/index.js
```

若想隔离现有 DSH Profile，可在命令前加：

```sh
DSH_HOME="$PWD/.local/dsh-home"
```

隔离目录不会继承现有 DSH 凭据；需要在 Web 设置中自行配置模型凭据，禁止写进仓库文件。

## 3. 启动

```sh
pnpm exec dsh --profile web \
  --patch "$PWD/.local/dsh/cordis.dev.yml" \
  --port 3091
```

打开 <http://127.0.0.1:3091>。终端出现该地址且页面可访问，证明官方 Web Profile 与本地插件已经完成真实 Cordis 组装。

当前 `rc.6` CLI 使用 `--profile web --patch`。不要写成 `dsh web --patch`；后者在该发布包中会拒绝父级 `--patch` 选项。

## 4. 对话验收

所有固定案例均为人工构造数据，不使用真实生日。

### 案例 A：先补齐信息

输入：

```text
帮我排一下八字。
```

预期：Agent 不应猜生日、时辰或地点，应先追问出生日期、性别、明确的时辰状态与时区。

### 案例 B：显式只请求八字

补充：

```text
这是人工测试案例：公历 2000 年 2 月 29 日 10:30，男，时区 Asia/Shanghai，使用民用时，只排八字。
```

预期 Tool 参数重点：

```json
{
  "birth": {
    "calendar": "gregorian",
    "date": { "year": 2000, "month": 2, "day": 29 },
    "time": { "status": "known", "hour": 10, "minute": 30 },
    "location": { "timeZone": "Asia/Shanghai" }
  },
  "gender": "male",
  "systems": ["bazi"],
  "conventions": { "timeMode": "civil" }
}
```

预期 canonical 结果：

```text
status: success
requestedSystems: [bazi]
systems[0].status: success
systems[0].chart.timePrecision: known
systems[0].chart.provenance: tyme4ts@1.5.2
```

Observation 应包含公历／农历锚点、四柱、日主、每柱藏干与十神、纳音、旬空、十二长生、起运和八步大运。每步大运必须同时写清交运年份与周岁范围，不能只输出容易误解的“6–15”。

### 案例 C：省略 systems

重新开启一轮，提供相同人工出生信息，但不指定八字或紫微。

预期：Tool 层把 `systems` 解析成 `bazi + ziwei`，顶层返回 `success`，并按请求顺序保留两套真实命盘：

- 八字与案例 B 的结果一致；
- 紫微来自 `iztro@2.5.8`，包含命身宫、命主身主、五行局、十二宫、星曜亮度／四化和大限；
- Observation 分开标注两套事实和各自 Provider，不把紫微字段混进八字结构。

### 案例 D：真太阳时缺经度

输入人工出生信息并要求 `apparent_solar`，但不提供经度。

预期：若 Agent 在调用前识别到 description 约束，应先追问经度；即使模型仍发起调用，Tool 也返回 `needs_clarification / LONGITUDE_REQUIRED`，Observation 要求确认 `birth.location.longitudeDegrees` 后重试。

### 案例 E：明确未知时辰

告诉 Agent：“出生时辰不知道”，其余人工信息完整。

预期 Tool 参数必须是：

```json
{ "status": "unknown" }
```

不得把 unknown 改写成单个 `00:00` 盘。预期默认双系统返回 `success`。八字 `timePrecision = unknown`，并满足：

- `candidates` 覆盖 `00:00–23:59` 全部 1440 分钟；
- 每个候选只包含年、月、日三柱，绝不包含时柱；
- 晚子时或节气边界造成的不同日柱、年／月柱、日主与大运不会被压成一个值；
- Observation 告诉 Agent 共同事实可以直接分析，差异事实按候选分别解释。

紫微同样必须 `timePrecision = unknown`，并满足：

- 返回早子、丑至亥、晚子共十三份候选，连续覆盖全天；
- 每份候选都有适用时段、命身宫锚点、命主身主、五行局和十二宫；
- Observation 不替用户选择唯一时辰，允许 Agent 比较共同事实和差异事实。

### 案例 F：仅请求紫微

提供完整人工出生信息并明确只排紫微，例如：

```text
这是人工测试案例：公历 2000 年 2 月 29 日 10:30，女，时区 Asia/Shanghai，使用民用时，只排紫微。
```

预期：返回 `success`，`requestedSystems = [ziwei]`，没有启动八字引擎。紫微结果必须披露：

```text
provider: iztro
providerVersion: 2.5.8
school: standard (default)
leapMonthRule: split_at_day_15 (default)
candidates.length: 1
candidates[0].palaces.length: 12
```

### 案例 G：显式紫微规则

对同一人工案例明确要求“中州派”，预期 Tool 参数包含：

```json
{
  "systems": ["ziwei"],
  "conventions": {
    "ziwei": {
      "school": "zhongzhou",
      "leapMonthRule": "split_at_day_15"
    }
  }
}
```

预期结果中的 `school.value = zhongzhou`、`school.source = explicit`，且 Observation 明确写出中州派。闰月规则只在输入为农历闰月时改变安宫；不得为普通公历案例伪造闰月差异。

## 5. 失败排查

- 没看到 Tool：重新执行 `pnpm run dsh:prepare`，再检查 `--dump-config` 最后一层。
- 插件入口不存在：确认 `lib/index.js` 已构建，Patch 不能指向已经移动的仓库。
- 页面启动但模型不可用：在 DSH 设置中检查模型凭据；这与插件注册无关。
- 端口占用：把 `3091` 改为其他未占用端口。
- 修改源码后行为没变化：重新执行 `pnpm run dsh:prepare` 并重启 DSH；当前加载的是构建产物，不是 TypeScript 源文件。

## 6. 本轮通过标准

- Patch 中真实出现 `fate-spectrum`。
- DSH Web Profile 能加载并提供页面。
- Agent 能看到并调用 `calculate_fate_chart`。
- 缺参时追问；参数齐全时进入 Executor。
- 显式单系统与默认双系统路由不同。
- 已知时辰只排八字、只排紫微和默认双系统都得到真实 `success`。
- 未知时辰得到八字全天条件候选与紫微十三候选，不出现伪造时柱或唯一时辰。
- `output.render()` 返回足以继续分析、且明确事实边界的 Observation。
- 紫微规则来源与 Provider 版本可追溯；真太阳时没有用占位算法冒充成功结果。

## 7. 关键代码 Review 顺序

1. `src/contracts/calculate-fate-chart/schemas.ts`：模型究竟能传什么；未知时辰、默认系统和真太阳时要求是否清楚。
2. `src/contracts/calculate-fate-chart/map-request.ts`：日期、时区、经纬度和跨字段规则如何从模型参数进入稳定领域值。
3. `src/application/fate-chart/resolve-conventions.ts`：默认值是否只有一个来源，显式值是否会覆盖默认。
4. `src/application/fate-chart/fate-chart.executor.ts`：时间能力是否只运行一次，`systems` 是否只启动需要的引擎，取消信号是否贯穿。
5. `src/capabilities/bazi/bazi.model.ts`：八字原局、候选、起运和大运领域字段是否与业务含义一致。
6. `src/providers/bazi/tyme-bazi.provider.ts`：Tyme 对象是否被隔离；未知时辰如何枚举压缩；换日与起运的全局 Provider 是否在 `finally` 恢复。
7. `src/capabilities/ziwei/ziwei.model.ts`：命身宫锚点、宫位／星曜稳定 ID、十二宫、四化、大限和十三候选是否表达准确。
8. `src/providers/ziwei/iztro-ziwei.provider.ts`：iztro 对象是否被隔离；时辰槽、流派、闰月、四化／亮度如何映射；全局配置是否在 `finally` 恢复。
9. `src/capabilities/*`：时间、八字、紫微是否是彼此独立的原子能力，没有跨体系读取或假数据。
10. `src/contracts/calculate-fate-chart/map-result.ts`：领域 outcome 怎样收敛成 `success / partial / needs_clarification / unsupported`，未预期结果是否真的抛出。
11. `src/projections/observation/render-fate-chart-observation.ts`：模型能否直接读懂八字大运、紫微宫星和候选条件，又不会混淆两套事实。
12. `src/adapters/dsh/calculate-fate-chart.tool.ts` 与 `src/index.ts`：DSH 边缘是否只负责 Tool 注册、映射、取消传递和依赖组装。

Review 时优先判断业务边界，不需要先纠结 TypeScript 语法：Schema 是模型入口，Executor 是排盘任务导演，原子引擎是独立计算部门，Provider 是第三方库翻译层，Observation 是给 Agent 的执行回执。
