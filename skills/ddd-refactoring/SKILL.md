---
name: ddd-refactoring
description: DDD 重構 playbook（Code Smell 識別 / 重構 pattern / 降風險順序 / PHP 實例）：Entity/ValueObject/Aggregate 抽取、PHP 專案架構優化。供 ddd-architect agent 執行 DDD 診斷與重構策略規劃時載入。
---

# DDD Refactoring Skill

PHP / WordPress 專案的 DDD 漸進式重構完整 playbook。

## Reference Files

- `references/code-smell-catalog.md` — PHP 常見 Code Smell 識別與嚴重度分級表
- `references/refactoring-patterns.md` — 五大重構 pattern（DTO / Enum / Service / Repository / Entity）詳細步驟
- `references/refactoring-sequence.md` — 降風險重構順序策略與路線圖格式
- `references/before-after-examples.md` — PHP DDD 重構前後對照範例與目標架構

Read the relevant reference file(s) based on the task at hand.

## Quick Decision: Which Reference?

```
任務是...
├─ 診斷階段，識別 Code Smell → references/code-smell-catalog.md
├─ 規劃階段,安排重構順序 → references/refactoring-sequence.md
├─ 執行階段,要挑選 pattern → references/refactoring-patterns.md
├─ 需要 PHP 實例參考 → references/before-after-examples.md
└─ 確認目標架構長相 → references/before-after-examples.md（含架構圖）
```

## 使用時機

- 接手混亂的 PHP / WordPress 專案需要重構時
- 專案已有 `specs/` 規格,準備依 Bounded Context 劃分模組時
- 已識別 God Class / Primitive Obsession 等 smell,需要具體重構步驟時
