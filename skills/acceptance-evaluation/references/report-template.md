# 標準驗收評估報告格式

## 為什麼要標準化

驗收報告是 orchestrator 決策的依據（PASS 結束流程 / FAIL 重派）。格式不一致會導致：
- orchestrator 漏看關鍵 FAIL 項
- 多次評估之間無法對齊比較
- 用戶 review 時找不到重點

## 完整模板

```markdown
# 驗收評估報告

**任務**：{用戶原始任務一句話}
**評估對象**：{產出物路徑或描述}
**專案類型**：{WEB / 桌面 / CLI / 文件 / 混合}
**評估迴圈**：第 {N} 輪 / 上限 3 輪
**總體判定**：{✅ PASS / ❌ FAIL}

---

## Testable Criteria（本次評估使用）

> 本節列出評估所依據的 criteria。若由 orchestrator dispatch 時提供，標明 [orchestrator]；若自行萃取，標明來源與信心度。

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | {具體可驗證敘述} | [explicit] | 100% |
| C2 | {具體可驗證敘述} | [derived] | 80% |
| C3 | {具體可驗證敘述} | [domain] | 60% |
| ... | ... | ... | ... |

---

## 逐條評估

### C1: {Criterion 敘述}
- **判定**：✅ PASS / ❌ FAIL / ⚠️ PASS w/ Note
- **維度**：[Coverage / Boundary / On-Topic / Quality Floor]
- **驗收動作**：{用了哪種手法，例如「playwright-cli 開頁面點按鈕」/「Read CLAUDE.md grep 關鍵字」}
- **觀察**：{具體看到什麼}
- **若 FAIL**：缺漏項是 {X}，建議改善為 {Y}

### C2: ...
（同上格式）

---

## 驗收亮點（Highlights）

> 即使 FAIL，也要列出做對的部分（避免只挑刺）。至少 2-3 點。

- ✅ {正確覆蓋的點 1}
- ✅ {正確覆蓋的點 2}
- ✅ {做得好的設計決策}

---

## 不達標項目摘要（FAIL 時必填）

> 給 orchestrator 看的 punch list。每項對應一條 FAIL criterion + 具體改善動作。

| # | 對應 Criterion | 缺什麼 | 建議改善動作 | 建議重派 agent |
|---|---------------|--------|------------|----------------|
| 1 | C2 | 註冊頁面未實作 | 補建 `/register` 路由 + 對應 component | @zenbu-powers:react-master |
| 2 | C5 | API 重複 email 未處理 | 在 controller 加 unique 檢查 + 回 409 | @zenbu-powers:nestjs-master |
| ... | ... | ... | ... | ... |

---

## Out-of-Scope 觀察（建議跟進，但不影響本次判定）

> 發現但不屬於本 agent 職責範圍的事項。建議 orchestrator 補派對應 reviewer/master。

- 🔍 [Code 品質] {觀察項} → 建議補派 `@zenbu-powers:react-reviewer`
- 🔍 [安全] {觀察項} → 建議補派 `@zenbu-powers:security-reviewer`
- 🔍 [效能] {觀察項} → 建議補派 `@zenbu-powers:wp-performance` SKILL

---

## 評估總結

{1-2 句話總結。PASS 的話強調哪些覆蓋得好；FAIL 的話強調最 critical 的缺漏。}

**下一步**：
- 若 PASS：流程結束，orchestrator 可回報用戶
- 若 FAIL：請 orchestrator 依「不達標項目摘要」重派對應 agent，修正後再 spawn 本 agent 複審
- 若已達 3 輪：建議 orchestrator 升級至用戶介入
```

## 範例：精簡版報告（PASS）

```markdown
# 驗收評估報告

**任務**：優化 CLAUDE.md
**評估對象**：C:\Users\user\.claude\CLAUDE.md
**專案類型**：純文件
**評估迴圈**：第 1 輪 / 上限 3 輪
**總體判定**：✅ PASS

---

## Testable Criteria

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | CLAUDE.md 必須有實際修改 | [explicit] | 100% |
| C2 | 行數應減少或維持（不應變得更冗長） | [derived] | 80% |
| C3 | markdown 語法無新引入瑕疵 | [domain] | 90% |
| C4 | 結構保持可讀 | [derived] | 70% |

---

## 逐條評估

### C1: CLAUDE.md 必須有實際修改
- **判定**：✅ PASS
- **維度**：[Coverage]
- **驗收動作**：Read 檔案 + 比對 git diff
- **觀察**：檔案從 28 行擴展到 ~52 行，新增「任務執行原則」與優化現有結構

### C2: 行數應減少或維持
- **判定**：⚠️ PASS w/ Note
- **維度**：[Coverage]
- **驗收動作**：wc -l 對比前後
- **觀察**：行數略增（28 → 52），但這是因為用戶要求補上 4 條任務執行原則。考慮到內容增加是合理的，本項視為 PASS。仍遠低於官方 200 行門檻。

### C3: markdown 語法無新引入瑕疵
- **判定**：✅ PASS
- **維度**：[Quality Floor]
- **驗收動作**：Read 全檔 + 檢視 inline code、blockquote、list 結構
- **觀察**：所有 inline code 反引號正確配對；無未閉合 code block；blockquote 與 list 結構正常

### C4: 結構保持可讀
- **判定**：✅ PASS
- **維度**：[Coverage]
- **驗收動作**：Read 比對 header 層級
- **觀察**：H1/H2/H3 層級清晰，4 個主要區塊（角色、任務執行原則、派發模式、子節）並列良好

---

## 驗收亮點

- ✅ 反引號未配對的語法瑕疵被修正
- ✅ Guard rail 機制正確設置，避免「全自主性」失控
- ✅ 與 zenbu-powers skill 的職責邊界宣告清晰

---

## Out-of-Scope 觀察

- 🔍 [可選] 個人偏好區塊（git/環境/工作風格）尚未補齊。用戶已知悉並選擇暫不加。

---

## 評估總結

CLAUDE.md 優化任務達標。林北的所有改動對齊用戶意圖，無 off-topic 修改，markdown 語法乾淨。

**下一步**：流程結束，回報用戶完成。
```

## 範例：精簡版報告（FAIL）

```markdown
# 驗收評估報告

**任務**：建立 acceptance-evaluator agent + 配套 skill
**評估對象**：agents/acceptance-evaluator.agent.md + skills/acceptance-evaluation/
**專案類型**：純文件
**評估迴圈**：第 1 輪 / 上限 3 輪
**總體判定**：❌ FAIL

---

## Testable Criteria

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | agent 檔案存在於指定路徑 | [explicit] | 100% |
| C2 | agent body < 150 行 | [orchestrator] | 100% |
| C3 | skill 包含 5 個 references | [orchestrator] | 100% |
| C4 | references 包含 WEB/桌面/CLI 驗收分流 | [explicit] | 100% |
| C5 | CLAUDE.md 已寫入驗收評估區塊 | [explicit] | 100% |

---

## 逐條評估

### C1: agent 檔案存在
- **判定**：✅ PASS
- ...

### C5: CLAUDE.md 已寫入驗收評估區塊
- **判定**：❌ FAIL
- **維度**：[Coverage]
- **驗收動作**：Read CLAUDE.md grep "驗收評估"
- **觀察**：未找到對應區塊。Task #4 似乎被跳過。
- **若 FAIL**：缺漏項是 CLAUDE.md 中的「驗收評估」區塊，建議補上條件觸發規則 + acceptance-evaluator 引用。

---

## 不達標項目摘要

| # | 對應 Criterion | 缺什麼 | 建議改善動作 | 建議重派 agent |
|---|---------------|--------|------------|----------------|
| 1 | C5 | CLAUDE.md 未寫入驗收評估區塊 | 補加 `## 驗收評估` 含條件觸發規則 | orchestrator 自行處理（簡單寫入）|

---

## 評估總結

agent + skill 部分達標，但 CLAUDE.md 整合未完成。屬於可快速修正的單點缺漏，建議 orchestrator 直接補上後再 spawn 本 agent 複審。

**下一步**：補上 CLAUDE.md 區塊 → 重新 spawn acceptance-evaluator → 預期第 2 輪 PASS。
```

## 報告寫作守則

1. **二元判定**：每條 criterion 必須給明確 ✅/❌（⚠️ 限「邊界 case 但不阻擋」場景）
2. **可執行的改善建議**：不寫「再仔細看看」，要寫「在 X 檔案的 Y 函式加入 Z 檢查」
3. **保留正向回饋**：即使整體 FAIL，也要列亮點（避免打擊產出者士氣 + 避免後續修改誤砍正確部分）
4. **out-of-scope 明確隔離**：code 品質問題標 out-of-scope，**不影響 PASS/FAIL**
5. **建議重派對象具體**：punch list 中標明該回到哪個 agent（master / reviewer / orchestrator）
