# ADR 0002：MVP 范围与执行边界

- 状态：已接受；Tool 数量部分由 ADR 0010 取代
- 确认日期：2026-08-16

## 决定

- 只暴露一个模型可见 Tool：`calculate_fate_chart`。
- `systems` 可请求八字、紫微或两者；省略时默认两者。
- `name`、`relation` 选填且不得影响计算事实。
- 共享输入失败和可安全修复的领域失败返回 canonical outcome。
- 同时请求两套系统时，只有一套成功、另一套发生可安全分类的独立 Provider 失败，才返回显式 `partial`。
- 只有输出不变量破坏、程序缺陷或非预期基础设施异常才抛出。
- MVP 不实现 Memory、数据库、缓存、RAG、自定义 UI、第二个 Agent Loop 或 Python 服务。

## 影响

Tool Schema、canonical output 和错误语义在实现或修改前必须得到用户明确确认。Phase 0 不包含 Tool 实现。

## 后续修订

“只暴露一个模型可见 Tool”只适用于 v0.1.0 排盘里程碑，不再是插件长期限制。长期 Tool 拆分与跨 Tool Agent 流程见 ADR 0010。
