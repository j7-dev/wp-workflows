# 場景速查與處置策略

## 常見場景速查

| 場景 | 推薦方案 |
|------|---------|
| 表格 CRUD | Refine.dev `useTable` + Ant Design `Table` |
| 表單 CRUD | Refine.dev `useForm` + Ant Design `Form` |
| 自訂 API 查詢 | Refine.dev `useCustom` 或 `useCustomMutation` |
| 批次刪除 | Refine.dev `useDeleteMany` + 確認對話框 |
| 全域狀態 | Jotai atom |
| 元件樹狀態 | React Context |
| 路由（WP 外掛） | react-router-dom + `HashRouter` |
| 樣式 | Tailwind CSS 優先，Ant Design 組件搭配 |
| 效能優化 | `memo` + `useCallback` + `useMemo` |
| 大量資料搜尋 | `useTransition` + `useDeferredValue` |

---

## 遇到違背原則的專案時的處置

### 步驟 1：評估當前任務性質

判斷當前的任務/Issue 是否屬於 **[優化]**、**[重構]**、**[改良]** 類型。

### 步驟 2A：是 [優化] / [重構] / [改良] 任務

- 檢查元件樹依賴關係，確認影響範圍
- 使用 IDE 的重新命名功能安全重構
- 逐步遷移：先建立新元件/Hook，再替換舊引用，最後移除舊代碼
- 確保重構後所有引用都正確更新

### 步驟 2B：不是 [優化] / [重構] / [改良] 任務

- 維持**最小變更原則**
- 只做當前任務所需的修改
- 避免大規模重構導致更多問題
- 在 PR 中標註發現的技術債，建議後續 Issue 處理

---

## 交付審查流程

### 完成後的動作：提交審查

當所有測試通過後，**必須**明確呼叫 reviewer agent 進行代碼審查：

```
@zenbu-powers-lite:react-reviewer
```

> 這是強制步驟，不可跳過。請確保 reviewer 完整審查所有修改過的檔案。

### 接收審查退回時的處理流程

當 `@zenbu-powers-lite:react-reviewer` 審查不通過並將意見退回時：

1. **逐一檢視**：仔細閱讀 reviewer 列出的所有嚴重問題和重要問題
2. **逐一修復**：按照 reviewer 的建議修改代碼，不可忽略任何阻擋合併的問題
3. **補充測試**：若 reviewer 指出缺少測試覆蓋的場景，補寫對應測試
4. **重新執行測試**：修改完成後，重新執行所有測試確認通過
5. **再次提交審查**：測試通過後，再次呼叫 `@zenbu-powers-lite:react-reviewer` 進行審查

```
修改完成 → 跑測試 → 全部通過 → @zenbu-powers-lite:react-reviewer
```

> 此迴圈會持續進行，直到 reviewer 回覆「審查通過」為止。最多進行 **3 輪**審查迴圈，若超過 3 輪仍未通過，應停止並請求人類介入。
