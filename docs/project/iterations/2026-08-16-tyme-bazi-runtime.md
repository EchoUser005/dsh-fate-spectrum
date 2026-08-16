# 迭代：Tyme 八字运行时与未知时辰候选

- 日期：2026-08-16
- 分支：`feat/tool-skeleton`
- 目标：把已审核八字字段接入真实 Tyme Provider，并交付 DSH 可消费的 `success/partial` 与候选 Observation

## 用户确认

- 未知时辰不要求强制补问，也不选择任意默认时刻。
- 返回当天所有真正不同的合法候选，标明适用时段；模型可以分析共同事实，并对差异作条件式解读。
- 所有候选省略时柱与时柱相关事实。
- 顶层 `partial` 仍只表示同时请求多个系统时，一套成功、另一套安全失败。

## 改动

- 接入精确版本 `tyme4ts@1.5.2`，增加独立 Provider 端口、Provider-backed 八字引擎和运行时依赖组装。
- 将 Tyme 四柱、藏干本／中／余气、柱干与藏干十神、纳音、旬空、十二长生、起运和八步大运映射为不含第三方对象的领域模型。
- 在同步临界区按调用切换换日与起运 Provider，并在 `finally` 恢复，避免不同调用串流派状态。
- 未知时辰枚举 `00:00–23:59` 全部分钟，按离散命盘与大运事实压缩候选，输出完整时间范围和交运时刻范围。
- 将 Tool output 升至 `0.1.0-dev.2`：显式八字为 `success`，默认双系统为八字成功加紫微未交付的 `partial`，非法农历／闰月为可修复结果。
- 重写 Observation，使模型获得真实柱内事实、清晰的大运年份／周岁，以及未知时辰的条件式分析约束。
- 新增 ADR 0013，冻结未知时辰候选不变量；更新 Tool、技术方案、里程碑、SOP、第三方声明和项目状态。

## 测试证据

- Provider 测试覆盖已知时辰映射、八步大运、存在／不存在的闰月、换日与起运 A/B/A 隔离。
- 普通日未知时辰候选范围合计恰好 1440 分钟；所有候选仅三柱。
- 合成节气日同时保留立春前后的不同年／月柱候选。
- DSH contract tests 验证 `success`、`partial`、未知时辰、非法农历日期和 Observation，并用官方 schema validator 校验 canonical JSON。
- 全仓 20 项测试通过；格式、Lint、类型与构建通过。
- `pnpm run dsh:prepare` 生成新构建；隔离 `DSH_HOME` 的 `--patch --dump-config` 出现 `fate-spectrum -> lib/index.js`。
- 隔离 DSH Web Profile 使用新构建在 `127.0.0.1:3093` 启动，HTTP 返回 `200 OK`，验证后已关闭。
- Node.js 24.19.0 通过冻结安装、格式、Lint、类型、20 项测试、离线测试、探针与构建；Node.js 22.19.0 通过类型、20 项测试与构建。

## 待人工验收

用户在已有 DSH 凭据的 Web Profile 中按 SOP 验收自然语言补问、已知时辰真实八字、默认双系统 `partial` 和未知时辰候选。当前未提交、未 push、未创建 Tag/Release、未发布 npm。
