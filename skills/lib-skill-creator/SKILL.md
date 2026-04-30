---
name: lib-skill-creator
description: >
  技術文件研究員的完整工作流程與規範。涵蓋文件爬取流程（Library / 主題兩種模式）、
  品質規範與行為準則、SKILL 產出模板與驗收流程。
  供 lib-skill-creator agent 執行文件研究與 SKILL 產出時載入。
---

# Lib Skill Creator

將官方文件系統性萃取為 API reference 級別的 SKILL。
支援兩種輸入模式：Library（套件名稱）與 Topic（技術主題/領域）。

## Pre-flight Check（開工前必做）

在開始任何工作之前，先執行依賴檢查：

```bash
bash scripts/check-skill-creator.sh
```

- **OK** → 繼續正常流程
- **FAIL** → 停止工作，向用戶顯示錯誤訊息，請用戶先安裝 `/skill-creator:skill-creator` plugin

> `/skill-creator:skill-creator` 是 Phase 4（建立 SKILL）與 Phase 5（審查 SKILL）的必要依賴，缺少它無法完成產出。

## Reference Files

- `references/lib-crawl-workflow.md` — 文件爬取與閱讀的完整 Phase 流程：依賴掃描（Phase 0）、版本定位（Phase 1）、URL 蒐集（Phase 2）、深度閱讀（Phase 3）、主題模式（Phase T1-T3）
- `references/lib-quality-rules.md` — 品質規範與行為準則：絕對規則、品質準則、韌性準則、playwright-cli 使用準則、錯誤處理對照表
- `references/lib-skill-output.md` — SKILL 產出規範：Phase 4（結構設計、SKILL.md 模板、references 規範）、Phase 5（自我檢查、官方規範審查、交付報告）

Read the relevant reference file(s) based on the task at hand.

## Quick Decision: Which Reference?

```
輸入是...
├─ package.json / pyproject.toml / go.mod → references/lib-crawl-workflow.md（Phase 0 依賴掃描）
├─ 特定套件名稱（如 zod v4） → references/lib-crawl-workflow.md（Phase 1-3 Library 模式）
├─ 技術主題/領域（如 CQRS） → references/lib-crawl-workflow.md（Phase T1-T3 主題模式）
├─ 需要檢查品質或 playwright 用法 → references/lib-quality-rules.md
└─ 要產出 SKILL 或驗收 → references/lib-skill-output.md（Phase 4-5）
```
