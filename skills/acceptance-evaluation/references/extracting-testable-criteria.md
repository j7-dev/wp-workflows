# 從用戶任務萃取 Testable Criteria

## 為什麼要萃取 testable criteria？

驗收評估的核心是「對齊」。沒有明確標準就沒有對齊——「看起來 OK」「應該可以」是失職判定。

Testable criteria 必須符合：
- **可驗證**（testable）：能透過讀檔、跑指令、看畫面來判斷是否達成
- **具體**（specific）：不是「做得好」，而是「X 函式回傳 Y」「Z 頁面能 render W 元件」
- **與用戶意圖對齊**（aligned）：直接從用戶原話推導，不擴大不縮小

## 來源優先序

1. **Orchestrator dispatch 提供的 criteria**（最高權威，直接用）
2. **用戶原始任務的明確陳述**（從原話直接抽）
3. **用戶任務的隱含需求**（推導但要標明「推導項」）
4. **領域常識**（最後才用，標明「常識補強項」）

## 萃取流程

### Phase 1：拆解用戶原始任務

把用戶原話拆成 3 類元素：

| 類型 | 問句 | 範例（用戶說「優化 CLAUDE.md」） |
|------|------|---------------------------------|
| **動詞** | 用戶要做什麼？ | 「優化」 |
| **目標物** | 對什麼做？ | `CLAUDE.md` |
| **隱含期待** | 「優化」在這 context 下意味著什麼？ | 更精簡、更精準、符合官方規範 |

### Phase 2：產出顯式 + 隱式 criteria

**顯式 criteria**（從原話抽）：
- C1: `CLAUDE.md` 必須被修改（產出物存在性）
- C2: 修改方向必須是「優化」（不是新增無關內容）

**隱式 criteria**（依 context 推導）：
- C3: 行數應減少或維持（「優化」通常含精簡語意）
- C4: 結構應更清晰或維持
- C5: 不應引入新的瑕疵（語法錯誤、邏輯衝突）

### Phase 3：標明來源

每條 criterion 在報告中必須附來源標籤：

```
[explicit]    用戶原話直接抽
[derived]     從上下文推導
[domain]      領域常識補強
[orchestrator] orchestrator dispatch 時提供
```

範例：

```
- C1 [explicit]: CLAUDE.md 檔案必須有實際修改
- C3 [derived]: 「優化」隱含「至少不變得更冗長」
- C5 [domain]: 修改後不應有 markdown 語法錯誤
```

## 抽 criteria 的常見陷阱

### 陷阱 1：把 reviewer 的工作偷渡進來

❌ 錯誤：「C6: code 必須符合 React 18 hooks best practice」
- **理由**：這是 react-reviewer 的職責。acceptance-evaluator 只審「用戶要的功能有沒有做到」

✅ 正確：「C6: 用戶要求的 component 必須能 render 並通過手動操作」

### 陷阱 2：擴大用戶需求

❌ 錯誤：用戶說「加一個按鈕」→ 抽出「C7: 按鈕必須有 hover 效果、ARIA 標籤、響應式設計」
- **理由**：除非用戶明示，否則不要把領域常識**升級**為 criterion

✅ 正確：「C7: 按鈕存在且能點擊」+「[domain] 建議補：a11y / 響應式（標 out-of-scope，建議補派 reviewer）」

### 陷阱 3：含糊 criteria

❌ 錯誤：「C8: UI 必須好用」
- **理由**：無法驗證

✅ 正確：「C8: 從 X 頁進到 Y 頁應 ≤ 2 次點擊」（可實測）

### 陷阱 4：忽略邊界與錯誤路徑

用戶說「加一個登入功能」往往隱含：
- 登入成功要怎樣（happy path）
- 登入失敗要怎樣（密碼錯誤、帳號鎖定、網路斷線）
- 邊界（空值、超長字串、特殊字元）

萃取時要把這些都列為 [derived] criteria，避免產出只覆蓋 happy path 卻被判 PASS。

## Orchestrator 未提供 criteria 時怎麼辦

1. 自行依本流程推導
2. 在報告開頭明確聲明：「本次評估使用的 testable criteria 由本 agent 自行萃取，來源見每條標籤」
3. 列出全部 criteria 讓 orchestrator/用戶事後可挑戰

> **不要拒評**——拒評會中斷 evaluation loop。除非用戶任務描述「真的無法萃取任何 criterion」（極罕見），否則先萃出最佳近似版本並標明信心度。

## 信心度標註

每條 criterion 可選附信心度（0-100%）：

```
- C1 [explicit, 100%]: CLAUDE.md 檔案必須有實際修改
- C3 [derived, 80%]: 「優化」隱含「至少不變得更冗長」
- C5 [domain, 60%]: 修改後不應有 markdown 語法錯誤
```

低信心度（< 50%）的 criterion 在 FAIL 時要謹慎——可能是萃取偏差，建議在報告中註明「此項可能屬於 over-derived，請 orchestrator/用戶確認」。
