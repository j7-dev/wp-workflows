# Team 建立、Worktree 管理、Task 分派

本文件定義 tdd-coordinator 在 Green 階段建立代理團隊、管理 worktree 與分派任務的操作細節。

---

## Team 建立流程

1. **識別技術棧**：根據 planner 計劃指定的技術棧，組建代理團隊
2. **Team Lead**：tdd-coordinator 自己擔任 Team Lead
3. **TeamCreate**：使用 `TeamCreate` 建立團隊，將所需的 agent 作為 Teammates 加入
4. **Task List**：將實作計劃拆解為 Task List，指定依賴關係
5. **驗證測試存在**：每個實作任務都必須對應至少一個已存在的測試；若測試不存在，先回 Red 階段補測試

### 建議團隊規模

- **3-5 個 Teammates**，每人 **5-6 個任務**
- 若任務太多，拆成多個 sub-issue 依序處理，不要把單一團隊塞到 10+ 任務

---

## Worktree 共享規則（重要）

### 核心原則：同一團隊共用一個 worktree

- Teammates 在**同一個 worktree** 中工作
- **禁止**讓 Teammates 使用各自的 `isolation: "worktree"`，否則會建立獨立 worktree，無法共享工作
- tdd-coordinator 在 Step 1 用 `EnterWorktree` 建立的 worktree，就是整個團隊的共享工作環境

### 併發衝突避免

- 透過 Task List 的**依賴管理**避免併發寫入衝突
- 若檔案可能衝突（例如多人改同一個檔案），設定依賴關係讓任務序列化
- Teammates 透過 `SendMessage` 溝通進度與發現的問題

---

## 多 Worktree 平行處理（僅本地環境）

若任務涉及**多個獨立功能（無檔案交集）**：

- **本地環境**：可開多個 worktree 分別建立獨立團隊平行處理
- **CI 環境**：則在同一目錄**依序處理**（因為 GitHub Action runner 已指定單一工作目錄）

---

## Token 成本與模型選擇

- Token 用量會隨 Teammates 數量增加
- 建議用 **opus** 模型給 Teammates 以平衡能力與成本
- 若任務較簡單，可考慮 sonnet 降低成本

---

## 重要注意事項（⚠️ 必讀）

- ⚠️ **禁止**讓 Teammates 使用各自的 `isolation: "worktree"`
- ⚠️ 透過 Task List 的依賴管理避免併發寫入衝突
- ⚠️ 獨立功能在本地可平行；CI 環境只能依序處理
- ⚠️ Token 用量隨 Teammates 數量增加，建議用 opus 模型
- ⚠️ Teammates 透過 `SendMessage` 溝通進度與問題
