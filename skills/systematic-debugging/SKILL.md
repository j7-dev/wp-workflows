---
name: systematic-debugging
description: >
  系統化除錯方法論。遇到任何 bug、測試失敗或非預期行為時使用，在提出任何修復方案前強制執行。
  以 4 階段流程（根因調查 → 模式分析 → 假設驗證 → 實作修復）杜絕「猜一下、改一下」的隨機修補，
  並針對 WordPress / React / AIBDD 場景補充常見 bug 模式。
  改寫自 obra/superpowers 的 systematic-debugging skill，在地化為 WP 生態。
---

# 系統化除錯 Playbook

## 核心原則

**沒有根因調查就沒有修復。** 隨機修補浪費時間且製造新 bug，症狀修復是失敗。

> ⚠️ **鐵律**：完成 Phase 1（根因調查）之前，**禁止提出任何修復方案**。
>
> 違反此原則的字面意思就是違反除錯的精神。

---

## 適用情境

對任何技術問題都適用：

- 測試失敗（PHPUnit / Vitest / Playwright）
- 線上 bug、非預期行為
- 效能問題、Build 失敗
- WordPress hook 沒觸發、REST API 回傳異常
- React render 異常、state 不同步
- CI / GitHub Actions 紅燈

**特別必須使用的時機：**

- 趕時間（緊急情況最容易亂猜）
- 「這應該很簡單」的直覺
- 已經試過 2 次以上修復都沒用
- 你並不真的理解這個 bug

**禁止的鬆綁理由：**

- 「問題看起來很小」→ 簡單 bug 也有根因，照流程跑反而更快
- 「老闆現在就要修好」→ 系統化比 thrash 快
- 「我先試一下這個」→ 第一個修復決定後續模式，一開始就要做對

---

## 4 階段流程（不得跳階）

### Phase 1：根因調查 🔍

**在提出任何修復之前**：

1. **完整讀錯誤訊息**
   - 不要跳過 warning
   - 完整讀 stack trace，記下行號、檔案路徑、錯誤碼
   - PHP fatal error 經常已經告訴你問題在哪

2. **可重現性確認**
   - 能穩定觸發嗎？步驟是？
   - 不能穩定重現 → 加 instrumentation 收集資料，**不要猜**

3. **檢查最近變更**
   - `git diff`、`git log -10`
   - 新增的依賴、`composer.json` / `package.json` 改動
   - WordPress 升級、PHP 版本變化
   - WP-Cron 排程、Object Cache 設定變更

4. **多元件系統的 instrumentation**

   WordPress 與 React 應用通常跨多層（PHP → REST API → React → WP REST → DB）。
   提出修復前，**先在每個元件邊界加 log**：

   ```php
   // PHP layer
   error_log( '[DEBUG][hook=init] user_id=' . get_current_user_id() );

   // REST API layer
   error_log( '[DEBUG][rest] payload=' . wp_json_encode( $request->get_params() ) );
   ```

   ```typescript
   // React layer
   console.log('[DEBUG][useQuery]', { isLoading, error, data });
   ```

   跑一次收集證據 → **看哪一層斷掉** → 再深入該層調查。

5. **資料流回溯**

   錯誤出現在 stack 深處時，**往上追到「壞值的源頭」**，在源頭修，不在症狀點修。
   詳見 `references/root-cause-tracing.md`。

### Phase 2：模式分析 🧩

**修之前先找模式：**

1. **找正常運作的對照組** — 同一個 codebase 裡有沒有類似但能運作的程式碼？
2. **完整讀參考實作** — 不要 skim，每行都讀。例如要實作 Custom Post Type，去看 WP core 怎麼註冊
3. **列差異** — 工作版 vs 壞版的所有差異，再小都列，不要假設「這應該無關」
4. **理解依賴** — 需要什麼 hook 順序？什麼 capability？什麼 nonce？

### Phase 3：假設驗證 🧪

**科學方法：**

1. **單一假設** — 寫下：「我認為根因是 X，因為 Y」
2. **最小化測試** — 一次只改一個變數
3. **驗證後才繼續** — 沒中 → 提出新假設，**不要在錯誤修復上疊加**
4. **不知道就說不知道** — 不要硬猜

### Phase 4：實作修復 🔧

**修根因，不修症狀：**

1. **先寫一個能重現 bug 的失敗測試**
   - 用 `@wp-workflows:test-creator` 產生骨架
   - 沒有失敗測試 → 不准動產品程式碼
   - 對應 `wp-workflows:tdd-workflow` 的 Red 階段

2. **單一修復** — 解決根因；禁止「順便重構」、「順便改一下」
3. **驗證修復**
   - 跑剛剛寫的失敗測試 → 應該綠
   - 跑全套測試 → 不能弄壞別的
   - **必須執行 `wp-workflows:tdd-workflow` 的 Green Gate（貼命令輸出）**
4. **修不好怎麼辦**
   - 試了 < 3 次 → 回 Phase 1，帶著新資訊重新分析
   - **試了 ≥ 3 次 → 停下來質疑架構**（見下節）

### Phase 4.5：3 次修復都失敗 → 質疑架構 🚨

**架構性問題的訊號：**

- 每次修復都在不同地方挖出新的 shared state / coupling 問題
- 修復需要「大規模重構」才能塞進去
- 每個修復都製造新的症狀

**這時候不要再試 Fix #4**，而是：

- 問：這個 pattern 從根本上對嗎？
- 我們是不是只因為慣性才繼續用它？
- 該不該砍掉重練架構？

**必須與使用者討論後才能繼續。** 這不是「假設失敗」，是「架構錯誤」。

---

## WordPress / React / AIBDD 常見 bug 模式

### WordPress / PHP

| 模式 | 症狀 | 真正的根因 |
|---|---|---|
| **Hook 順序錯誤** | `add_action` 沒觸發 / 觸發時資料還沒準備好 | priority 設錯、hook 在當前 request 已經跑完了、用 `init` 做 `wp_loaded` 該做的事 |
| **Nonce 失效** | REST API 401、表單提交失敗 | nonce 過期、user 已登出、nonce action 名稱不一致、cache 把 nonce 快取了 |
| **Capability 漏檢查** | 越權、API 任何人能打 | `permission_callback` 寫成 `__return_true`、`current_user_can` 帶錯 capability |
| **Object Cache 不一致** | 改了資料但讀回來是舊的 | 改完忘了 `wp_cache_delete`、persistent cache 跨 request 殘留、`update_option` 後沒清相關 transient |
| **HPOS 雙寫漂移** | WooCommerce order 在 wp_posts 與 wc_orders 表不一致 | 直接寫 wp_posts 而沒用 CRUD API、舊 plugin 還在用 `get_post_meta` 讀 order meta |
| **PHP 8 deprecation** | warning 滿天飛、未來版本壞掉 | `null` 傳給期待 string 的函式、`{}` 字串存取語法 |
| **`autoload=yes` 撐爆 wp_options** | 整站慢 | 把大物件用 `update_option` 存且沒設 `autoload=no` |

### React / TypeScript

| 模式 | 症狀 | 真正的根因 |
|---|---|---|
| **Render race condition** | 資料 flash、UI 閃舊值 | useEffect 沒清 stale closure、useState 沒帶 functional updater、TanStack Query 的 `keepPreviousData` 用錯 |
| **Hook 規則違反** | 「Rendered fewer hooks than expected」 | early return 在 hook 之前、hook 寫在 `if` 裡 |
| **Stale closure** | 事件 handler 拿到舊 state | useCallback 依賴漏列、setInterval 沒重建 |
| **List key 重複** | 重排時 component state 錯位 | 用 array index 當 key、key 不穩定 |
| **TanStack Query cache 不刷新** | mutate 後資料沒更新 | 沒呼叫 `invalidateQueries`、queryKey 結構不一致 |

### AIBDD / Spec

| 模式 | 症狀 | 真正的根因 |
|---|---|---|
| **Feature 對 API 漂移** | E2E 跑得過、整合測試失敗 | feature 改了但 api.yml 沒同步、用 `wp-workflows:aibdd-consistency-analyzer` 掃 |
| **Entity / ERM 漏欄位** | handler 拿不到欄位、type error | `erm.dbml` 過時、Aggregate 沒重生 |
| **ASM/GAP 標註被忽略** | 規格腦補導致實作走偏 | 看到 `ASM`、`GAP` 沒回澄清就硬寫 |

---

## Red Flags — 立刻停手回 Phase 1

如果你發現自己在想：

- 「先快速修一下，之後再調查」
- 「試著改 X 看看會不會好」
- 「一次改多個地方，跑跑看」
- 「測試先跳過，我手動驗證一下」
- 「應該是 X，先改」
- 「我不太懂但這樣也許會 work」
- 「pattern 是這樣寫，但我改一下應該也行」
- 「再試最後一次」（已經失敗 2+ 次）
- 每個修復都在不同地方挖出新問題

**全部停手。回 Phase 1。**

**3+ 次修復失敗 → 質疑架構（Phase 4.5）。**

---

## 使用者對你的訊號 = 你做錯了

當使用者講以下這些話，代表你的方法錯了：

- 「真的嗎？」「你確定？」 → 你在猜，沒驗證
- 「會不會印一下 …？」 → 你應該已經加 instrumentation
- 「不要再猜了」 → 你跳過調查直接提修復
- 「再深入想一下」 → 質疑根本，不是症狀
- 「我們是不是卡住了？」（語氣挫折）→ 你的方法沒在前進

**看到這些訊號，立刻停手回 Phase 1。**

---

## 常見藉口對照表

| 藉口 | 真相 |
|---|---|
| 「問題很簡單，不用走流程」 | 簡單 bug 也有根因，跑流程很快 |
| 「緊急情況沒時間走流程」 | 系統化比亂改快 |
| 「先試一下這個再來調查」 | 第一個修復定錨後續，一開始就要做對 |
| 「修好之後再補測試」 | 沒測試的修復不持久 |
| 「一次改多個地方省時間」 | 隔離不出哪個有效，新增 bug |
| 「reference 太長，我改一下 pattern 就好」 | 半吊子理解 = 必 bug，完整讀 |
| 「我看到問題了，直接修」 | 看到症狀 ≠ 理解根因 |
| 「再試最後一次」（試了 2+ 次） | 3+ 次失敗 = 架構問題 |

---

## 與 wp-workflows 其他 skill / agent 的整合

| 整合對象 | 角色 |
|---|---|
| `wp-workflows:tdd-workflow` | Phase 4 的失敗測試走 Red 階段；Phase 4 的修復驗證走 Green Gate |
| `@wp-workflows:test-creator` | Phase 4 寫失敗測試的執行者 |
| `wp-workflows:aibdd-consistency-analyzer` | AIBDD 場景下檢查規格漂移 |
| `@wp-workflows:wordpress-master` | WP 領域實作根因修復 |
| `@wp-workflows:react-master` | React 領域實作根因修復 |
| `@wp-workflows:security-reviewer` | 若 bug 涉及權限、資料外洩，必須拉進來審 |

---

## 快速參考

| Phase | 主要動作 | 完成條件 |
|---|---|---|
| 1. 根因 | 讀錯誤、重現、檢查變更、加 log、追資料流 | 知道**什麼**壞了、**為什麼**壞了 |
| 2. 模式 | 找對照組、讀 reference、列差異 | 找出工作版與壞版的差異 |
| 3. 假設 | 寫下假設、最小化測試 | 假設被證實或被推翻 |
| 4. 修復 | 寫失敗測試、修根因、驗證 | bug 解掉、所有測試綠 |
| 4.5 | 3+ 次失敗 → 質疑架構 | 與使用者討論後決定方向 |

---

## 真正的目的

| 隨機修補 | 系統化除錯 |
|---|---|
| 2-3 小時 thrash | 15-30 分鐘解掉 |
| 第一次修對率 ~40% | ~95% |
| 經常製造新 bug | 幾乎不製造 |

**走流程不是慢，是快。**

---

## 進階參考（可選）

完整的 root cause tracing、defense in depth、condition-based waiting 技巧：

- 原文版本可參考 `superpowers:systematic-debugging` skill 的 reference 檔案
  - root-cause-tracing.md
  - defense-in-depth.md
  - condition-based-waiting.md
- 兩者搭配使用：本 skill 提供 WP/React 場景化指引，superpowers 原版提供更詳細的 Node.js / 通用範例
