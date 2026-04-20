# Verification Gate — Evidence over Claims

每個 TDD Gate（Red Gate / Green Gate / Refactor 收尾）通過之前必讀。

改寫自 obra/superpowers 的 `verification-before-completion` skill，融合 wp-workflows 的 Gate 流程。

---

## 鐵律

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

在當前訊息中沒執行過驗證命令，就**不准**宣稱已通過。

---

## Gate 通過 5 步驟

```
在說「Gate 通過 / 完成 / 已修好」之前：

1. IDENTIFY  — 哪個命令能證明這件事？
2. RUN       — 執行完整命令（不可省略 flag、不可截短）
3. READ      — 讀完整輸出、檢查 exit code、數失敗數
4. VERIFY    — 輸出真的支撐我的宣稱嗎？
   - 不是 → 如實回報實際狀態
   - 是   → 帶證據宣稱
5. ONLY THEN — 才能下結論

省略任一步 = 說謊，不是驗證
```

---

## 證據格式（必貼）

每個 Gate 通過的回報，**必須**包含：

```text
✅ <Gate 名稱> 通過

執行命令：
$ <完整命令>

輸出（節錄關鍵段）：
<貼前 5 行 + exit code 那段>

EXIT_CODE=0
測試結果：N passed / 0 failed
```

或失敗時：

```text
❌ <Gate 名稱> 未通過

執行命令：
$ <完整命令>

輸出：
<完整 error / 失敗清單>

EXIT_CODE=<非零>
失敗測試：<清單>
```

---

## 常見宣稱 vs 必要證據

| 宣稱 | 需要的證據 | 不夠的東西 |
|---|---|---|
| Red Gate 通過 | 測試命令輸出顯示「N failed, 0 passed」+ exit code ≠ 0 | 「測試應該會失敗」「上次跑是失敗的」 |
| Green Gate 通過 | 測試命令輸出顯示「N passed, 0 failed」+ exit code = 0 | 「實作完成了」「邏輯應該對」 |
| Linter 乾淨 | linter 命令 exit 0 | 部分檔案檢查、推論 |
| Build 成功 | build 命令 exit 0 | linter 過了 ≠ build 過 |
| Bug 修好了 | 重現原始症狀的測試現在通過 | 程式改了所以應該好了 |
| Regression test 有效 | Red-Green 循環驗證過（先 revert fix 看測試紅，再放回看綠） | 「我寫了 regression test」 |
| Sub-agent 完成任務 | `git diff` / `git status` 看到實際檔案變更 | Sub-agent 自己回報「成功」 |
| 規格需求達成 | 對照 plan / spec 逐條檢查清單 | 「測試過了所以這階段完成」 |

---

## Red Flags — 立刻停手

如果你正在用以下字眼，**沒跑命令就不能講出來**：

- 「應該」「大概」「看起來」「probably」「should」
- 「完成了！」「修好了！」「Perfect！」「Done！」
- 即將 commit / push / 開 PR 但還沒跑驗證
- 信任 sub-agent 的成功回報沒做 diff 確認
- 部分驗證後外推
- 「就這一次例外」
- 累了想趕快收工
- 任何「暗示成功」的字眼但沒跑過命令

---

## 常見藉口對照表

| 藉口 | 真相 |
|---|---|
| 「現在應該會過」 | 跑命令再講 |
| 「我有信心」 | 信心 ≠ 證據 |
| 「就這一次例外」 | 沒有例外 |
| 「Linter 過了所以 build 也會過」 | Linter ≠ compiler |
| 「Sub-agent 說成功了」 | 自己用 git diff 驗 |
| 「我累了」 | 累 ≠ 藉口 |
| 「部分檢查就夠了」 | 部分證明不了什麼 |
| 「換個說法應該不適用這條規則」 | 精神高於字面 |

---

## TDD Gate 對應的具體驗證命令範例

### Red Gate（測試必須失敗）

```bash
# PHP 整合測試
npx wp-env run tests-cli vendor/bin/phpunit --testsuite=integration 2>&1
echo "EXIT_CODE=$?"

# E2E
npx playwright test 2>&1
echo "EXIT_CODE=$?"

# Vitest
npx vitest run 2>&1
echo "EXIT_CODE=$?"
```

通過條件：`EXIT_CODE != 0` 且輸出顯示「斷言失敗」或「class/method 不存在」。

### Green Gate（測試必須全綠）

```bash
# 同上命令，但 EXIT_CODE 必須 == 0
```

### Regression Test 驗證（修 bug 場景）

```bash
# Step 1: 寫好 fix 與 test，跑一次 → 應該綠
<test command>; echo "EXIT_CODE=$?"

# Step 2: revert fix（保留 test）→ 必須紅
git stash -- <fix files>
<test command>; echo "EXIT_CODE=$?"   # 必須非零

# Step 3: 還原 fix → 必須綠
git stash pop
<test command>; echo "EXIT_CODE=$?"   # 必須零
```

---

## 為什麼這條規則是無條件的

來自 superpowers 的 24 個失敗記憶：

- 使用者說「我不相信你」→ 信任崩壞
- 未定義的函式被 ship → 線上炸
- 缺需求被 ship → 功能不完整
- 假完成導致 redirect → rework，浪費時間
- 違反「誠實是核心價值。如果你說謊，你會被換掉。」

---

## 整合

| 上游 / 下游 | 角色 |
|---|---|
| `wp-workflows:tdd-workflow` SKILL.md | 在 Gate 通過前 Read 本檔 |
| `red-green-refactor-cycle.md` | Red Gate / Green Gate 細節中引用本檔的證據格式 |
| `superpowers:verification-before-completion` | 通用版本（非 TDD 場景也適用），可平行使用 |
| `wp-workflows:systematic-debugging` Phase 4 | 修 bug 後必過本檔的 Regression Test 驗證 |

---

## 底線

**驗證沒有捷徑。**

跑命令。讀輸出。**然後**才宣稱結果。

不可妥協。
