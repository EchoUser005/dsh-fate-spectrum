# 迭代：Tyme 八字 Provider 探针

- 日期：2026-08-16
- 分支：`feat/tool-skeleton`
- 目标：验证 `tyme4ts@1.5.2` 对首版八字字段、流派隔离与未知时辰的真实能力

## 改动

- 将 `tyme4ts@1.5.2` 作为精确运行时依赖加入 lockfile。
- 增加合成 Provider 探针，覆盖四柱、藏干、十神、纳音、旬空、十二长生、起运、大运、重复确定性和 Provider A/B/A 恢复。
- 记录 npm、官方仓库、变更记录与 MIT 许可证证据。
- 验证未知时辰在晚子时和节气交接日会影响日柱、年／月柱、起运周岁、交运年份和大运序列，因此不能只删除时柱后返回伪单盘。

## 证据

- `pnpm run probe:tyme` 通过。
- 合成已知时辰案例重复 20 次，`distinctResults = 1`。
- 默认换日与晚子时同日 Provider 产生预期差异，恢复默认后结果与第一次一致。
- `lunar_sect_1` 与 `lunar_sect_2` 的交运时刻产生可观测差异。
- 合成未知时辰案例证明日柱和交运信息存在多个合法候选；合成节气日证明年柱、月柱也可能存在多个候选。
- Node.js 24.19.0 下冻结安装、格式、Lint、类型、14 项测试、离线测试与构建通过。
- Node.js 22.19.0 下类型、14 项测试与构建通过；`git diff --check` 和隐私扫描通过。

## 收口

用户随后确认未知时辰采用完整候选语义，本探针的决策门已由 [ADR 0013](../decisions/0013-unknown-birth-time-candidates.md) 关闭。正式 Provider、`success/partial` 与 Observation 作为下一份运行时迭代单独记录。本探针轮未提交、未 push。
