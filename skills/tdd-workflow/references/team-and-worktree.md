# Team 建立、Worktree 管理、Task 分派（進階參考）

> **⚠️ ADVANCED — opt-in only**
>
> 本文件是**進階參考**，僅在使用者明確要求啟用 Agent Teams 模式時才需閱讀。
> TDD 預設流程使用純 sub-agent 鏈式委派（見 [red-green-refactor-cycle.md](red-green-refactor-cycle.md)），不主動使用 team / worktree。
>
> 何時才考慮進階模式：
> - 多 master 必須**平行**開發（非順序）
> - 需要 master ↔ reviewer 直接 SendMessage 退回迴圈，主窗口不想當人肉郵差
> - 多獨立功能在本地需要 worktree 隔離
>
> 沒有以上需求 → 用預設的 sub-agent 鏈式即可，**不要**進入此模式。
>
> **本文件的讀者是「主窗口（orchestrator / Team Lead）」**，不是 tdd-coordinator。
> tdd-coordinator 是 sub-agent，**無法**呼叫 `TeamCreate` / `Agent()` / `SendMessage`。
> 主窗口讀完 tdd-coordinator 的協調藍圖後，依本文件 SOP 親自執行 team 建立與運作。

---

## 0. 前置檢查

### 0.1 必要環境變數

`~/.claude/settings.json` 必須包含：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**沒設這個 flag**，整套 Agent Teams 工具（`TeamCreate` / `Agent(team_name=...)` / `SendMessage` / `TeamDelete`）**根本不存在**，呼叫會失敗。

### 0.2 官方限制清單（影響本流程設計）

- **Lead is fixed**：建立 team 的 session 終身為 lead，無法轉移。
- **No nested teams**：teammate 不能 spawn team 或新增 teammates。
- **Subagents cannot spawn other subagents**：sub-agent 也無法呼叫 `Agent()`。
- **One team per session**：同一 session 同時只能有一個 team；連跑要 `TeamDelete` 重建。
- **No session resumption with in-process teammates**：本地 `/resume` 會炸 in-process teammates，CI headless 沒這問題。

→ 結論：**主窗口必須親自當 lead**，從 `TeamCreate` 一路扛到 `TeamDelete`。

---

## 1. Team 建立 SOP（主窗口執行）

### 1.1 Step 1：識別技術棧 + 確定成員清單

來源：tdd-coordinator 藍圖 → 引用 planner 的 `suggested_team`。

常見組合：

| 專案類型 | Master | Reviewer |
|---------|--------|----------|
| WordPress Plugin | `zenbu-powers:wordpress-master` | `zenbu-powers:wordpress-reviewer` + `zenbu-powers:security-reviewer` |
| React 前端 | `zenbu-powers:react-master` | `zenbu-powers:react-reviewer` |
| Node.js 後端 | `zenbu-powers:nodejs-master` | `zenbu-powers:security-reviewer` |
| NestJS 後端 | `zenbu-powers:nestjs-master` | `zenbu-powers:nestjs-reviewer` |

### 1.2 Step 2：建立 Worktree（本地環境才需要）

```
EnterWorktree(name="tdd-{issue-id}")
```

CI 環境跳過——GitHub Action runner 已指定單一工作目錄。

### 1.3 Step 3：建立 Team

```
TeamCreate(team_name="tdd-{issue-id}")
```

主窗口呼叫的當下，主窗口本身就是 lead。**不可在後續嘗試把 lead 轉給 teammate**，官方規範禁止。

### 1.4 Step 4：動態加入 Teammates

每個成員一次 `Agent` 呼叫，**不要**指定 `isolation: "worktree"`（避免各自開獨立 worktree）：

```
# Red 階段：tester
Agent(
  team_name="tdd-{issue-id}",
  name="tester",
  subagent_type="zenbu-powers:test-creator",
  prompt="<從 tdd-coordinator 藍圖第 2 節複製>"
)

# Green 階段：依語言/領域動態加入 master
Agent(
  team_name="tdd-{issue-id}",
  name="impl-backend",
  subagent_type="zenbu-powers:wordpress-master",
  prompt="<從藍圖第 4 節複製>"
)

Agent(
  team_name="tdd-{issue-id}",
  name="impl-frontend",
  subagent_type="zenbu-powers:react-master",
  prompt="<從藍圖第 4 節複製>"
)

# Refactor 階段：依語言/領域動態加入 reviewer
Agent(
  team_name="tdd-{issue-id}",
  name="rev-wp",
  subagent_type="zenbu-powers:wordpress-reviewer",
  prompt="<從藍圖第 6 節複製>"
)

Agent(
  team_name="tdd-{issue-id}",
  name="rev-sec",
  subagent_type="zenbu-powers:security-reviewer",
  prompt="<從藍圖第 6 節複製>"
)
```

**注意**：
- `name` 是 teammate 在 team 內的識別（用於 `SendMessage(to=name)`）
- `subagent_type` 必須是已存在的 agent 名稱（含 plugin namespace 前綴）
- 不要寫 `subagent_type="agent"` 之類的佔位字串——會找不到 agent 定義

### 1.5 Step 5：建立 Task List（避免併發衝突）

依 tdd-coordinator 藍圖中的依賴關係建立 task：

```
TaskCreate(subject="生成失敗測試", owner="tester", ...)
TaskCreate(subject="實作後端", owner="impl-backend", addBlockedBy=["1"])
TaskCreate(subject="實作前端", owner="impl-frontend", addBlockedBy=["1"])
TaskCreate(subject="後端審查", owner="rev-wp", addBlockedBy=["2"])
TaskCreate(subject="安全審查", owner="rev-sec", addBlockedBy=["2","3"])
```

**為什麼用 task list 而不是直接 SendMessage**：
- task 持久化、可被多 teammate 看到
- `addBlockedBy` 自動排程，避免 teammate 同時動手撞到同一檔案
- 主窗口隨時可 `TaskList` 查狀態

---

## 2. Worktree 共享規則（關鍵！）

### 2.1 核心原則：同團隊共用一個 worktree

- 所有 teammate 在主窗口（lead）建立的**同一個 worktree** 中工作
- **禁止**讓 teammate 自己用 `isolation: "worktree"`，否則各自開獨立 worktree，無法共享測試與程式碼

### 2.2 為什麼 teammate 不能各自開 worktree

TDD 鐵律：**所有 agent 看到同一份測試 + 同一份程式碼**。

若 master 在 worktree A 寫實作、reviewer 在 worktree B 看程式碼，他們看到的根本不是同一份檔案——審查就失去意義。

### 2.3 併發衝突避免

- 透過 task list 的 `addBlockedBy` 序列化會撞檔的任務
- 例如：「impl-backend 改 service.php」必須在「test-creator 寫 service-test.php」之後
- 真的撞到 git 衝突時：呼叫 `@zenbu-powers:conflict-resolver` agent 處理（主窗口 spawn 新的 sub-agent，不放 team 裡）

---

## 3. Master ↔ Reviewer 退回迴圈

這是後段協作的核心循環。**主窗口要監看 SendMessage 流量，不能放任 teammates 自己跑**。

### 3.1 標準流程

```
1. 主窗口 spawn 各 reviewer（Agent + team_name）
2. reviewer 跑完審查後：
   - 有問題 → SendMessage(to="impl-X", message="issue list...") + TaskCreate(owner="impl-X")
   - 無問題 → TaskUpdate(rev-task, status="completed")
3. master 收訊 / 看到新 task → 修復 → 跑測試自驗 → SendMessage(to="rev-X", message="請複審")
4. reviewer 重審 → 通過 → TaskUpdate(status="completed")
5. 全部 reviewer task 完成 → 主窗口親跑最終 Green Gate（再跑一次測試確保改完還綠）
```

### 3.2 SendMessage 範例

reviewer 退回給 master：

```
SendMessage(
  to="impl-backend",
  message="""
  審查發現 3 個必修問題：
  1. service.php:45 缺少 nonce 驗證 → CSRF 風險
  2. service.php:78 SQL 直接拼字串 → 改用 $wpdb->prepare()
  3. service.php:120 缺少能力檢查 → current_user_can('manage_options')

  請修復後 SendMessage 通知我複審。
  """
)
```

master 修復後通知 reviewer：

```
SendMessage(
  to="rev-wp",
  message="""
  3 個問題已修復，請複審：
  1. 已加 wp_verify_nonce
  2. 已改用 $wpdb->prepare()
  3. 已加 current_user_can 守衛

  Green Gate 已重跑通過：EXIT_CODE=0
  """
)
```

### 3.3 迴圈次數限制

- 每對 master ↔ reviewer 最多 **3 輪**
- 超過 3 輪仍卡住 → 主窗口介入：`TeamDelete` + 回報使用者人工介入
- 避免死循環吃光 token

### 3.4 Idle teammate 喚醒

- 官方原文：「Idle teammates can receive messages. Sending a message to an idle teammate wakes them up.」
- teammate 完成 turn 後 idle 是正常的，SendMessage 自動喚醒
- 若主窗口指派 task 後 teammate 沒進度，可主動 `SendMessage(to=teammate, message="開始 task #X")` 喚醒

---

## 4. 平行 Worktree（多功能獨立開發）

### 4.1 適用情境

任務涉及**多個完全獨立的功能**（無檔案交集、無共享依賴），且在**本地環境**：

- 主窗口可建立**多個獨立的 worktree**
- 但因「One team per session」限制，**不能同時有多個 team**
- 解法：每個獨立功能跑完一輪（建 team → 跑完 → `TeamDelete`）再進下一個

### 4.2 CI 環境

GitHub Action runner 只有單一工作目錄，**所有功能在同一目錄依序處理**。
規模過大時，拆成多個 issue / 多個 workflow run。

---

## 5. 收尾流程

```
1. 所有 reviewer task 標 completed
2. 主窗口親跑最終 Green Gate（Bash + 貼 EXIT_CODE）
3. spawn doc-updater：
   Agent(team_name="tdd-{issue}", name="docs", subagent_type="zenbu-powers:doc-updater", prompt="...")
4. 等 doc-updater 完成後：
   TeamDelete()
5. CI 環境：commit + push（由 Action 建 PR）
   本地環境：ExitWorktree(action="keep") 保留 worktree 等使用者驗收
```

---

## 6. 模型選擇與 Token 成本

### 6.1 建議模型分配

| 角色 | 模型 | 原因 |
|------|------|------|
| Master（實作） | `opus` | 開發品質要求高 |
| Reviewer（審查） | `sonnet` 可考慮 | 審查邏輯相對結構化，降成本 |
| test-creator | `opus` | 測試設計也吃理解力 |
| doc-updater | `sonnet` 可考慮 | 文件同步相對機械 |

### 6.2 Team 規模建議

- **3-5 個 teammates** 為最佳平衡
- 任務過大 → 拆 sub-issue 多輪跑，**不要**塞 10+ teammates 進一個 team
- 每個 teammate 都吃完整 codebase context，token 線性放大

---

## 7. ⚠️ 重要注意事項清單

1. **Lead 終身固定**：一旦 `TeamCreate`，lead 不可轉移
2. **禁止 `isolation: "worktree"`**：所有 teammate 共用一個 worktree
3. **One team per session**：要連跑多個獨立 team 必須 `TeamDelete` 重建
4. **`/resume` 會炸 in-process teammates**：本地 interactive 模式小心；CI headless 沒這問題
5. **Evidence over Claims**：Gate 通過必須貼命令輸出 + EXIT_CODE，不接受 teammate 口頭回報
6. **退回迴圈次數限制**：每對 master↔reviewer 最多 3 輪，超過人工介入
7. **本地 vs CI**：本地支援多 worktree（依序建 team），CI 只能單一工作目錄依序處理
8. **task list 比 SendMessage 優先**：用 task 的 `addBlockedBy` 序列化避免併發衝突，SendMessage 用於通知
