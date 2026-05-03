# 與 reviewer agents 的職責邊界守則

## 為什麼要劃清邊界

ecosystem 中已有多個 `*-reviewer` agents（react-reviewer、wordpress-reviewer、nestjs-reviewer、security-reviewer 等）。**acceptance-evaluator 必須與它們正交不重疊**，否則：

- 同樣的 code 被多個 agent 重複審
- 用戶報告中出現衝突結論
- agent 之間互踩職責導致信任崩盤

## 核心原則：兩條軸正交

```
                    用戶意圖對齊（acceptance-evaluator）
                              ▲
                              │
                              │  ✅ 我管
                              │
                              │
   Code 品質  ◄───────────────┼─────────────► 系統行為
                              │
                              │  ❌ reviewer 管，我不碰
                              │
                              ▼
                    Best Practice / 安全 / 效能（*-reviewer）
```

- **垂直軸（acceptance-evaluator）**：用戶要 X，產出有沒有給 X？有沒有偏題？邊界完不完整？
- **水平軸（reviewer）**：產出的 X 寫得好不好？符不符合該領域的 best practice？

兩軸獨立。一份 code 可能：
- ✅ 用戶意圖對齊 + ✅ Code 品質好 → 整體 OK
- ✅ 用戶意圖對齊 + ❌ Code 品質爛 → acceptance PASS, reviewer FAIL
- ❌ 用戶意圖偏題 + ✅ Code 品質好 → acceptance FAIL, reviewer PASS（但意義不大）
- ❌ 用戶意圖偏題 + ❌ Code 品質爛 → 兩個都 FAIL

## 具體職責對照表

| 議題類型 | acceptance-evaluator 管嗎？ | 應該誰管？ |
|---------|---------------------------|-----------|
| 用戶要的功能有沒有做到 | ✅ 管 | acceptance-evaluator |
| 邊界 case 有沒有覆蓋（錯誤處理、空值） | ✅ 管 | acceptance-evaluator |
| 用戶沒要的東西被多做了嗎 | ✅ 管 | acceptance-evaluator |
| 連動效應有沒有處理（改 A 順便改 B） | ✅ 管 | acceptance-evaluator |
| Code 能不能跑（語法錯誤、import 缺漏） | ✅ 管（Quality Floor） | acceptance-evaluator |
| 文件 markdown 語法正不正確 | ✅ 管（Quality Floor） | acceptance-evaluator |
| Hook 用法符不符合 React 18 best practice | ❌ 不管 | react-reviewer |
| 變數命名 / 函式長度 / SOLID 原則 | ❌ 不管 | reviewer |
| OWASP 漏洞 / nonce / CSRF | ❌ 不管 | security-reviewer |
| WordPress hook / HPOS / capability check | ❌ 不管 | wordpress-reviewer |
| TypeORM repository pattern 用得對不對 | ❌ 不管 | nestjs-reviewer |
| SQL N+1 / 索引 / 效能優化 | ❌ 不管 | wp-performance / 對應 reviewer |
| 測試覆蓋率 / 測試品質 | ❌ 不管 | test-creator / reviewer |
| commit message 格式 | ❌ 不管 | git-commit SKILL |

## 灰色地帶判斷流程

遇到「這該不該管」的灰色項，問自己：

**Q1**：這個問題是「用戶要的東西沒做到」還是「做到了但寫得不好」？
- 沒做到 → acceptance 管
- 做到了但寫得不好 → reviewer 管

**Q2**：用戶原話有沒有提到 best practice / 品質要求？
- 有（如「請依 React 18 best practice 重構」）→ 變成 acceptance criterion，acceptance 管
- 沒有 → reviewer 管

**Q3**：不修的話，產出能 work 嗎？
- 不能 work → Quality Floor，acceptance 管
- 能 work 只是不漂亮 → reviewer 管

### 範例 1：登入功能有 SQL injection 風險

- **acceptance**：用戶要的「登入功能」做到了嗎？✅ 是 → Coverage PASS
- **acceptance**：能 work 嗎？✅ 能（功能正常）→ Quality Floor PASS
- **acceptance 報告**：標 out-of-scope「發現 SQL 拼接風險，建議補派 @security-reviewer」
- **整體 acceptance 判定**：PASS（但有 out-of-scope 警示）

### 範例 2：登入功能但寫成「永遠回 true」（fake 實作）

- **acceptance**：用戶要的「能驗證帳密」做到了嗎？❌ 沒有（永遠通過）→ Coverage FAIL
- **acceptance 判定**：FAIL（這是功能沒做到，不是 code 品質）

### 範例 3：用戶要「優化 CLAUDE.md」，agent 砍了一段重要規則

- **acceptance**：用戶意圖是「優化」，砍掉重要規則違反意圖嗎？是 → Off-Topic FAIL（多做了用戶沒要的「刪除核心規則」）
- 不需要 reviewer，acceptance 自己就能判定

## 報告中的邊界宣告

每份報告開頭可加一段（選用）：

```markdown
> **本評估範圍**：用戶意圖對齊、需求覆蓋、邊界完整、off-topic 偵測、基本可用性。
> **不在範圍內**：code 品質、安全漏洞、效能、測試覆蓋率、命名規範等——這些屬於 reviewer agents 職責，
> 若發現相關問題會列在「Out-of-Scope 觀察」並建議補派對應 reviewer。
```

## 與其他 agent 的協作模式

### 模式 1：先 acceptance，後 reviewer（推薦）

```
master → acceptance-evaluator → PASS → reviewer → PASS → 結束
                                    └─ FAIL → 退回 master
```

**優點**：先確認方向對，再優化品質。方向錯的東西優化也沒用。

### 模式 2：平行（適合多領域整合）

```
master → ┬→ acceptance-evaluator
         ├→ react-reviewer
         └→ security-reviewer
              （結果合併由 orchestrator 整合）
```

**優點**：節省時間。
**風險**：若 acceptance FAIL（方向錯），reviewer 的審查就白做了。

### 模式 3：只走 acceptance（輕量任務）

```
master → acceptance-evaluator → PASS/FAIL
```

**適用**：純文件、配置、低風險變更，不需要深度 code review。

## 何時主動建議補派 reviewer

acceptance-evaluator 在 PASS 報告的「Out-of-Scope 觀察」區塊**主動建議**補派 reviewer 的時機：

1. **看到明顯 code smell 但不影響 PASS**：不修能 work，但長期會出事
2. **領域風險高**：涉及金流、auth、外部 API、權限提升
3. **用戶 context 顯示重視品質**：之前 session 有 review 紀錄、CLAUDE.md 提到 review 紀律
4. **產出規模大**：超過 100 行的新 code，光 acceptance 不夠

不建議的時機：
- 改錯字、reformat 等微小變更
- 純文件變更（除非用戶要求文件審）
- 明確的 throwaway / prototype 任務

## 自我檢查 checklist

報告產出前，逐條確認：

- [ ] 我的每條 FAIL 對應「用戶要的東西沒做到」或「能不能 work」，不是「寫得不夠漂亮」
- [ ] 我發現的 code 品質問題都標在 out-of-scope 而不是 FAIL
- [ ] 我建議補派的 reviewer 與問題類型對應（PHP 問題 → wordpress-reviewer，不是 react-reviewer）
- [ ] 我沒有在報告中重複 reviewer 該做的工作（語法 nitpick、命名建議等）
- [ ] 我的 PASS/FAIL 判定能透過引用 testable criteria 解釋

通不過任一項 → 重寫對應段落。
