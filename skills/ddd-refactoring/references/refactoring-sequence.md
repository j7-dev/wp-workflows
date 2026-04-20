# Refactoring Sequence Strategy

降風險重構順序策略。如何把一堆 smell 轉換為可執行、可驗證的 Phase / Task 序列。

## 排序原則

### 由內而外

先建立 Domain 層(Entity、Value Object、DTO),再處理 Application 與 Infrastructure。
Domain 層是其他層的依賴,先穩定它才不會回頭重做。

### 由小而大

先重構獨立的小模組(利用率低、耦合少),再處理耦合度高的核心模組。
讓團隊先練手、建立信心,再挑戰大魚。

### 每個任務可獨立驗證

每個重構任務完成後可單獨跑 E2E 測試。
拒絕「要一次改 10 個檔案才看得出效果」的任務。

### 風險遞增

Phase 1 風險極低(DTO、Enum),Phase 4 才動核心架構。
有任何 Phase 失敗,損失被限縮在該 Phase 內。

## 標準四階段路線圖

```
Phase 1:建立 Domain 基礎(風險:低)
  Task 1.1:提取 XXX 的 DTO / Value Object
  Task 1.2:提取 YYY 的 Enum
  Task 1.3:建立 ZZZ Entity(若概念夠清楚)

Phase 2:抽離業務邏輯(風險:中)
  Task 2.1:將 XXXController 的業務邏輯搬到 XXXService
  Task 2.2:將 Hook callback 的業務邏輯搬到 Service
  Task 2.3:...

Phase 3:統一資料存取(風險:中)
  Task 3.1:建立 XXXRepository 取代散落的 $wpdb 查詢
  Task 3.2:將 Repository 回傳型別改為 Entity
  Task 3.3:...

Phase 4:整合與清理(風險:中高)
  Task 4.1:統一 Hook 註冊到 Infrastructure 層
  Task 4.2:移除舊有的過渡代碼
  Task 4.3:更新 Bounded Context 之間的整合點
```

## Task 命名規範

每個 Task 用「動詞 + 對象」的形式:
- 提取 `OrderDTO`
- 抽離 `CheckoutController::process_payment()` 至 `PaymentService`
- 建立 `SubscriptionRepository`

避免模糊的 Task 名稱:
- 不好:「整理 Order 相關代碼」
- 不好:「重構 checkout 流程」

## Task 執行協議

每個 Task 的執行流程:

1. **描述要做什麼**:清楚說明這個任務要移動 / 提取 / 重組哪些程式碼
2. **指派給 `@zenbu-powers:wordpress-master`**:讓它執行實際的 PHP 開發
3. **執行 E2E 測試**:確認功能沒有被破壞
4. **驗證通過後**,才進入下一個任務

> 鐵律:每次重構後必須通過 E2E 測試才能繼續。測試失敗必須立即修復,不能跳過。

## Bounded Context 決定排序

多個 Context 存在時,排序原則:

1. **先重構讀多寫少的 Context**(如 Catalog、Report) — 風險較低
2. **再重構核心業務 Context**(如 Order、Checkout)
3. **最後處理整合型 Context**(如 Webhook、ExternalSync)

Context 劃分依據 `./specs/` 目錄的領域文件。

## 過渡狀態是允許的

漸進式重構允許:
- 舊代碼與新代碼並存一段時間
- 一個 Repository 先只覆蓋部分查詢
- Entity 初期可能只有少量方法

不追求一步到位。每步都要能跑、能測。

## 參考

- 各 pattern 細節 → `refactoring-patterns.md`
- 實例 → `before-after-examples.md`
