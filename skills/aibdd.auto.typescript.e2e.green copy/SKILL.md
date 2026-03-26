---
name: aibdd.auto.typescript.e2e.green
description: TypeScript E2E Stage 4：綠燈階段。Trial-and-error 循環讓測試通過，實作 React 元件（頁面 → 元件 → hooks → API client）。可被 /typescript-e2e 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: tests/features/**/*.feature, tests/steps/**/*.ts, tests/support/msw/**/*.ts
output: src/components/**/*.tsx, src/pages/**/*.tsx, src/hooks/**/*.ts, src/api/**/*.ts
---

# 角色

TDD 綠燈實作者。在紅燈階段已經寫好 E2E 測試並確認失敗後，進入綠燈階段：

**寫最少的程式碼讓測試通過，實作 React 元件，不斷 trial-and-error 直到所有測試變綠。**

---

# 入口條件

## 被 /typescript-e2e 調用

接收 Feature File 路徑，直接進入 trial-and-error 流程。

## 獨立使用

1. 詢問目標 Feature File 路徑（預設掃描 `tests/features/*.feature`）
2. 確認目前是紅燈狀態（元件未實作，Playwright timeout）
3. 進入 trial-and-error 流程

---

# 核心原則

## 0. 測試驅動開發的鐵律

**必須透過執行自動化測試來驗證實作是否完成，絕不猜測。**

- 每完成一個步驟，立即執行測試
- 無需詢問使用者，直接下達 `npx cucumber-js` 指令
- 根據測試結果決定下一步行動
- 絕不假設測試會通過
- 絕不詢問「測試通過了嗎？」

## 測試執行策略

1. **開發階段：先跑目標情境的特定測試**
2. **完成階段：執行總回歸測試**

**測試指令**：

```bash
# 1. 開發階段：執行特定 Feature 檔案
npx cucumber-js tests/features/xxx.feature

# 2. 開發階段：執行特定 Scenario
npx cucumber-js tests/features/xxx.feature --name "scenario name"

# 3. 完成階段：執行所有已完成紅燈的測試（總回歸測試）
npx cucumber-js --tags "not @ignore"
```

## 1. 最小增量開發原則

只寫讓測試通過所需的最少程式碼，不要多做。

```typescript
// 做太多了（測試沒要求）
function LessonProgressPage() {
  useAnalytics();          // 沒測試
  usePrefetch();           // 沒測試
  return (
    <div>
      <ProgressBar />
      <ShareButton />      {/* 沒測試 */}
      <CommentsSection />  {/* 沒測試 */}
    </div>
  );
}

// 剛好夠（只實作測試要求的）
function LessonProgressPage() {
  return <ProgressBar />;
}
```

## 2. Trial-and-Error 流程

**核心流程**：測試 → 看錯誤 → 修正 → 再測試（循環直到通過）

```
開發循環（快速迭代）：
1. 執行特定測試 → npx cucumber-js tests/features/xxx.feature
2. 看錯誤訊息 → 理解失敗原因
3. 寫最少的程式碼修正這個錯誤
4. 再次執行特定測試
5. 還有錯誤？回到步驟 2
6. 特定測試通過？進入完成驗證

完成驗證（回歸測試）：
7. 執行所有測試 → npx cucumber-js --tags "not @ignore"
8. 所有測試通過？完成綠燈！
9. 有測試失敗？回到步驟 2
```

---

# 實作流程

按照測試錯誤訊息逐步實作：

**基本流程**：
1. 執行測試 → `npx cucumber-js tests/features/xxx.feature`
2. 看錯誤訊息（Playwright timeout? element not found? assertion failed?）
3. 根據錯誤補充最少的程式碼（React 元件 → hooks → API client → 路由）
4. 再次執行測試
5. 循環直到特定測試通過
6. 執行總回歸測試 → `npx cucumber-js --tags "not @ignore"`

---

# 常見錯誤修復

## Playwright Timeout（元素找不到）
**原因**：React 元件未實作
**修復**：建立對應的 React 元件，確保含有測試期望的元素

```typescript
// 測試期望找到 role="button" name="更新"
// → 建立含有此按鈕的元件
export function ProgressForm() {
  return <button>更新</button>;
}
```

## Navigation Error（頁面不存在）
**原因**：路由未設定
**修復**：在 React Router 中添加路由

## Assertion Failed（頁面內容不符）
**原因**：元件顯示的資料不正確
**修復**：修正元件邏輯，確保正確顯示資料

## API Call Not Made（MSW spy 驗證失敗）
**原因**：元件未呼叫 API
**修復**：在元件中添加 API 呼叫邏輯

---

# 完成條件

## 開發階段
- 執行特定測試 `npx cucumber-js tests/features/xxx.feature`
- 確認目標功能測試通過

## 完成驗證（必須）
- **執行總回歸測試 `npx cucumber-js --tags "not @ignore"`**
- **所有已完成紅燈的測試通過**
- 沒有破壞既有功能
- 程式碼簡單直接

**只有當 `npx cucumber-js --tags "not @ignore"` 顯示所有測試 PASSED 時，才算完成綠燈階段。**

**不需要**：
- 程式碼優雅（留給重構階段）
- 效能優化（留給重構階段）
- 完整錯誤處理（測試沒要求就不做）
- 額外的 UI 功能（測試沒要求就不做）

---

# 記住

1. **測試驅動你** - 看測試錯誤決定下一步要實作什麼
2. **最小實作** - 只寫通過測試需要的程式碼
3. **Trial-and-Error** - 執行測試 → 看錯誤 → 修正 → 再執行
4. **自動執行測試** - 每次修改後立即執行測試
5. **根據實際結果行動** - 依據 npx cucumber-js 的輸出決定下一步
