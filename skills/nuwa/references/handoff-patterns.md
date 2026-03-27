# Workflow 交接模式

## 模式一：單向鏈（Subagent 串接）

```
coordinator 依序啟動：
  → spawn Agent A → A 完成 → 結果回到 coordinator
  → spawn Agent B（帶 A 的結果）→ B 完成 → 結果回到 coordinator
  → spawn Agent C（帶 B 的結果）→ C 完成 → 結果回到 coordinator
```

**適用場景**：
- 每個 Agent 只做一次，不需要回頭
- 典型流水線：`clarifier → planner → implementer → reviewer`

**Agent 交接協議寫法**：
```markdown
## 交接協議（WHERE NEXT）

### 完成時
1. 輸出結果摘要
2. **自動交接**給 `@wp-workflows:next-agent`，傳遞 {具體產出物}

### 失敗時
- 回報給 coordinator 或使用者
```

**注意**：Subagent 不能直接 spawn 另一個 subagent。交接是透過 coordinator（主對話）中繼的。
Agent 寫「自動交接給 @next-agent」，實際上是 coordinator 讀到這個指示後去 spawn next-agent。

---

## 模式二：回環（Agent Team + SendMessage）

```
coordinator (team lead)
  ├── Agent A (teammate)
  ├── Agent B (teammate)  ← C 完成後交回 B
  └── Agent C (teammate)  ← B 完成後交給 C
```

**適用場景**：
- 需要 A → B → C → B 的回環
- 典型流程：`implementer → reviewer → implementer（修復）→ reviewer（再審）`

**Agent 交接協議寫法**：
```markdown
## 交接協議（WHERE NEXT）

### 完成時
1. 使用 `SendMessage` 通知 `{downstream-agent}`，附上產出物摘要
2. 等待回應或結束

### 收到退回時
1. 讀取 reviewer 的修改建議
2. 逐一修復
3. 使用 `SendMessage` 再次通知 `{downstream-agent}`
4. 最多 **3 輪**迴圈，超過則 `SendMessage` 通知 coordinator 請求人類介入
```

**Team 建立方式**（由 coordinator 執行）：
```
TeamCreate → 建立 team
  → 指派 Agent B 為 teammate (worktree or same branch)
  → 指派 Agent C 為 teammate
TaskCreate → 建立任務清單
  → Agent B claim task → 執行 → SendMessage 給 C
  → Agent C claim task → 執行 → SendMessage 回 B
```

---

## 模式三：Hub-Spoke（中央調度）

```
coordinator (hub)
  ├── spawn Agent A → 結果回 hub
  ├── spawn Agent B → 結果回 hub   （可並行）
  ├── spawn Agent C → 結果回 hub
  └── coordinator 整合所有結果
```

**適用場景**：
- 多個 Agent 可以並行工作，互不依賴
- 典型流程：`reviewer-security + reviewer-performance + reviewer-style` 同時審查

**Agent 交接協議寫法**：
```markdown
## 交接協議（WHERE NEXT）

### 完成時
1. 回傳結構化報告給 coordinator
2. 不主動交接其他 Agent（由 coordinator 統一調度）
```

---

## 模式選擇決策

```
你的 workflow 需要...

├─ A 做完 → B 做完 → C 做完（各做一次）
│   → 模式一：單向鏈
│
├─ A 做完 → B 做完 → C 做完 → B 再做（有回環）
│   → 模式二：Agent Team
│
├─ A、B、C 同時做，最後彙整
│   → 模式三：Hub-Spoke
│
└─ 混合（先並行再串接再回環）
    → 組合使用：coordinator 先 Hub-Spoke 並行，再 Team 回環
```

---

## 交接產出物規範

不論哪種模式，交接時必須傳遞清楚的產出物：

| 產出物類型 | 格式 | 範例 |
|-----------|------|------|
| 規格文件 | 檔案路徑 | `specs/ 目錄下的 .feature、api.yml、erm.dbml` |
| 實作計劃 | 結構化文字 | Plan 文件包含步驟、風險、依賴 |
| 程式碼變更 | Git diff 或檔案清單 | `已修改: src/auth.ts, src/utils/token.ts` |
| 審查報告 | 結構化報告 | 嚴重性分級 + before/after diff |
| 錯誤報告 | 錯誤摘要 | 錯誤訊息 + 已嘗試方案 + 建議下一步 |
