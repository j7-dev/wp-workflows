---
name: global-consistency
description: 全域一致性傳播的完整 playbook——觸發條件、執行流程（aho-corasick 批次掃描）、適用範圍、委派規則。當執行任何重新命名、路徑變更、詞彙替換時載入。
---

# 全域一致性（Global Consistency）

任何重新命名 / 路徑變更 / 詞彙替換**都必須**在整個專案中傳播。Markdown、YAML 與設定檔沒有 `import` 圖譜——它們需要明確的掃描。

## 觸發條件

以下操作觸發全域一致性檢查：

- 檔案或目錄重新命名（例如 `tester.md` → `hm-tester.md`）。
- Skill / Agent / Rule 的名稱變更。
- 設定檔中的 key、路徑、URL 變更。
- 任何跨檔案引用的識別符變更。

## 執行流程

1. **收集變更模式**：列出所有被變更的舊值（old patterns）與新值（new patterns）。
2. **批次掃描**：使用 `zenbu-powers:aho-corasick-skill` 的 `scan` 模式，以舊值作為 patterns 對專案目錄進行批次搜尋；若 skill 不可用，退回使用 Grep 工具。
3. **同步更新**：對掃描結果中的每個命中位置，替換為對應的新值。
4. **驗證**：再次執行 scan 確認舊值已無殘留。

## 適用範圍

掃描範圍涵蓋但不限於：

- `.claude/` 目錄（agents、skills、rules、CLAUDE.md）。
- `specs/` 目錄（feature files、activity files、api.yml、erm.dbml）。
- 專案根目錄下的設定檔（.mcp.json、package.json、composer.json 等）。
- 任何 Markdown / YAML / JSON 格式的文件。

## 委派規則

- 主窗口在分派任務時，**必須在 prompt 中明確告知 Sub-Agent 變更的完整對照表**（舊值 → 新值），並要求 Sub-Agent 在完成主要修改後執行一致性掃描。
- 若多個 Sub-Agent 平行作業，由主窗口在整合階段負責最終的全域一致性驗證。
