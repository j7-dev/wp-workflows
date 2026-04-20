---
name: react-review-criteria
description: React 18 / TypeScript 程式碼審查 checklist，專精 hooks、效能、a11y 與 Ant Design / Refine / React Query 整合檢查。提供可逐項勾選的審查清單與 before/after 對比範例，供 @zenbu-powers:react-reviewer 審查時照表操作。與 @zenbu-powers:react-coding-standards 搭配：該 skill 寫「規範本身」，本 skill 寫「審查時照著跑的 checklist」。
---

# React 18 程式碼審查 Checklist

專供程式碼審查流程使用的結構化 checklist 與輸出模板。與 `@zenbu-powers:react-coding-standards` 的分工：

| Skill | 定位 |
|-------|------|
| `react-coding-standards` | 規範本身（命名、型別、結構順序、元件範例） |
| `react-review-criteria`（本技能） | 審查時照著逐項勾選的 checklist + 嚴重性等級 + 輸出報告模板 |

---

## 適用時機

- `react-reviewer` agent 執行 PR / MR 審查時
- 開發者自審 React / TypeScript 程式碼
- 需要產出結構化審查報告（含嚴重性等級、位置、建議修改）
- 需查詢框架專項檢查（Ant Design、Refine、React Query、Jotai）

---

## 審查嚴重性等級

| 等級 | 符號 | 說明 | 合併建議 |
|------|------|------|---------|
| 嚴重 | 🔴 | 型別安全漏洞、記憶體洩漏、安全問題、會導致 bug 的邏輯錯誤 | **阻擋合併** |
| 重要 | 🟠 | 違反核心規則、影響可維護性或效能的問題 | **阻擋合併** |
| 建議 | 🟡 | 命名不一致、可讀性問題、可優化之處 | 可合併，建議後續處理 |
| 備註 | 🔵 | 風格偏好、未來可考慮的優化方向 | 可合併 |

---

## 審查前置檢查（強制）

即使開發者聲稱已通過測試，reviewer 仍須獨立驗證：

```bash
# 取得變更範圍
git diff -- '*.tsx' '*.ts' '*.jsx' '*.js'

# 強制跑過的測試項（任一失敗即審查不通過）
npx tsc --noEmit
npx eslint src/ --ext .ts,.tsx
npx prettier --check "src/**/*.{ts,tsx,js,jsx}"
npm test   # 或 npx vitest run / npx jest --testPathIgnorePatterns='e2e|playwright'
```

若指令不存在，報告中註明「該工具未配置」即可，已配置的工具必須全部執行。任何失敗直接判定審查不通過。

---

## 十大審查類別（索引）

依主題拆分到 references：

| # | 類別 | 參考檔 |
|---|------|--------|
| 一 | TypeScript 型別安全 | `references/typescript-strict.md` |
| 二 | 安全性（XSS、Nonce、LLM 邊界） | `references/typescript-strict.md` |
| 三 | 元件結構與品質 | `references/hooks-and-performance.md` |
| 四 | 命名規範 | `references/typescript-strict.md` |
| 五 | React Hooks 正確性 | `references/hooks-and-performance.md` |
| 六 | 效能 | `references/hooks-and-performance.md` |
| 七 | 狀態管理 | `references/hooks-and-performance.md` |
| 八 | import 路徑（含循環依賴） | `references/typescript-strict.md` |
| 九 | WordPress Plugin 特殊規範 | `references/antd-refine-query-checks.md` |
| 十 | 程式碼異味 | `references/hooks-and-performance.md` |

---

## 框架專項檢查

| 框架 | 重點 | 參考檔 |
|------|------|--------|
| **Refine.dev** | `useTable`、`useForm`、`useCustom`，禁止自訂 fetch/axios | `references/antd-refine-query-checks.md` |
| **Ant Design 5** | `Form.Item` 處理表單欄位、`Table` 分頁、禁止 inline style | `references/antd-refine-query-checks.md` |
| **React Query** | `queryKey` 一致性、invalidation 模式、`enabled` 控制 | `references/antd-refine-query-checks.md` |
| **Jotai** | atom 加 `Atom` 後綴、衍生使用 derived atom | `references/hooks-and-performance.md` |
| **REST API 邊界** | 字串 vs 數字 ID 一致性、null / undefined 處理 | `references/antd-refine-query-checks.md` |

---

## 無障礙（a11y）

獨立章節見 `references/accessibility-a11y.md`，涵蓋 semantic HTML、keyboard navigation、ARIA、色彩對比等檢查項。

---

## 審查報告輸出格式

參見 `references/review-output-template.md`，內含：

- 審查摘要區塊模板
- 問題清單分類呈現（🔴 / 🟠 / 🟡 / 🔵）
- 優點與 Top 3 優先修改項目
- 審查結論訊息範本（通過 / 不通過 / 退回開發者）

---

## 使用方式

1. 先讀本 SKILL.md 取得全貌與嚴重性等級
2. 依 PR 涉及範疇載入對應 references/*.md
3. 按 checklist 逐項勾選，記下位置、類別、嚴重性
4. 依 `review-output-template.md` 組裝最終報告
