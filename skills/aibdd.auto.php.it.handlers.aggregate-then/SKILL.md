---
name: aibdd.auto.php.it.handlers.aggregate-then
description: >
  處理 Then 步驟中驗證 Aggregate 屬性狀態（透過 Repository 查 DB）的 handler 參考文件。觸發關鍵字：應為、的...為、數量應為。
  非 user-invocable，由 /aibdd.auto.php.it.red 在實作測試方法時載入。
---

# Handler: aggregate-then

## Trigger 辨識

本 handler 適用於 **Then** 步驟中驗證 **DB 端 Aggregate 屬性狀態** 的語句：

- 「用戶 Alice 在課程 1 的進度**應為** 80%，狀態**應為** "進行中"」
- 「訂單 ORD-001 的總金額**應為** 90000」
- 「用戶 Alice 的購物車商品**數量應為** 3」
- 「用戶 Alice **應不包含**商品 PROD-001」

關鍵字：`應為`、`的...為`、`數量應為`、`應包含`、`應不包含`

## 任務

透過 `$this->repos->xxx->findXxx()` 從 WordPress DB 取回當前 Aggregate 狀態，然後使用 PHPUnit 斷言驗證屬性值。**不重查 Service，不存取 `$this->queryResult`**（那屬於 readmodel-then）。

## 與其他 Handler 的區別

| 項目 | aggregate-then | readmodel-then | success-failure |
|---|---|---|---|
| 資料來源 | Repository（DB） | `$this->queryResult` | `$this->lastError` |
| 驗證對象 | Aggregate 屬性 | Query 回傳結果內容 | 操作成功/失敗 |
| 前置步驟 | 通常是 Command | 必須是 Query | 通常是 Command/Query |
| 是否查 DB | 是（Repository） | 否 | 否 |

## 實作流程

1. **從 `$this->ids` 取得主體 ID**：`$userId = $this->ids['Alice'];`
2. **透過 Repository 查詢**：`$progress = $this->repos->lessonProgress->findByUserAndLesson($userId, 1);`
3. **先 assertNotNull**：確認查得到記錄，避免後續 NPE。
4. **屬性斷言**：`assertSame`（嚴格型別比對）為主，字串用 `assertSame`、集合用 `assertCount`。
5. **中文狀態轉 Enum**：依對應表比對 enum 字串值。

## BDD 模式與程式碼範例

### 單一 Aggregate 屬性驗證

```gherkin
Then 用戶 "Alice" 在課程 1 的進度應為 80%，狀態應為 "進行中"
```

```php
$userId = $this->ids['Alice'];
$progress = $this->repos->lessonProgress->findByUserAndLesson($userId, 1);
$this->assertNotNull($progress, '找不到課程進度');
$this->assertSame(80, $progress->getProgress());
$this->assertSame('IN_PROGRESS', $progress->getStatus());
```

### 訂單金額驗證

```gherkin
Then 訂單 "ORD-001" 的總金額應為 90000，狀態應為 "已付款"
```

```php
$orderId = $this->ids['ORD-001'];
$order = $this->repos->order->findById($orderId);
$this->assertNotNull($order, '找不到訂單');
$this->assertSame(90000, $order->getTotalAmount());
$this->assertSame('PAID', $order->getStatus());
```

### DataTable 批量驗證

```gherkin
Then 用戶 "Alice" 的購物車應包含以下商品:
  | 商品 ID   | 數量 |
  | PROD-001 | 2    |
  | PROD-002 | 1    |
```

```php
$userId = $this->ids['Alice'];
$expected = [
    ['商品 ID' => 'PROD-001', '數量' => 2],
    ['商品 ID' => 'PROD-002', '數量' => 1],
];
foreach ($expected as $row) {
    $item = $this->repos->cartItem->findByUserAndProduct($userId, $row['商品 ID']);
    $this->assertNotNull($item, "找不到商品 {$row['商品 ID']}");
    $this->assertSame((int) $row['數量'], $item->getQuantity());
}
```

### 不存在性驗證

```gherkin
Then 用戶 "Alice" 的購物車應不包含商品 "PROD-001"
```

```php
$userId = $this->ids['Alice'];
$item = $this->repos->cartItem->findByUserAndProduct($userId, 'PROD-001');
$this->assertNull($item);
```

### 集合數量驗證

```gherkin
Then 用戶 "Alice" 的購物車應有 3 個商品
```

```php
$userId = $this->ids['Alice'];
$items = $this->repos->cartItem->findByUser($userId);
$this->assertCount(3, $items);
```

## 中文狀態對應表

| 中文 | Enum 值 | 適用實體 |
|---|---|---|
| 進行中 | `IN_PROGRESS` | Progress, Status |
| 已完成 | `COMPLETED` | Progress, Status |
| 未開始 | `NOT_STARTED` | Progress, Status |
| 已付款 | `PAID` | Order |
| 待付款 | `PENDING` | Order |
| 已取消 | `CANCELLED` | Order |

## 共用規則 R1-R6

- **R1（透過 Repository）**：驗證來源必須為 `$this->repos->xxx`，禁止直連 `$wpdb`、禁用 Service、禁讀 `$this->queryResult`。
- **R2（完整主鍵）**：使用複合主鍵完整定位，避免誤中其他記錄。
- **R3（中文 → Enum）**：狀態字面值依對應表轉換，不可直接字面比對。
- **R4（assertNotNull 先行）**：讀取後先確認非 null，再取屬性斷言，避免 NPE 噪音。
- **R5（唯讀）**：Then 步驟禁止任何寫入（無 `save()`、無 `delete()`、無 `update()`）。
- **R6（assertSame 為主）**：型別敏感比對用 `assertSame`；數值比大小用 `assertGreaterThan` 等；字串包含用 `assertStringContainsString`。

## 完成條件

- [ ] 所有驗證均透過 `$this->repos->xxx` 進行
- [ ] 每次 Repository 查詢後皆有 `assertNotNull` / `assertNull`
- [ ] 中文狀態已轉為 Enum 常數比對
- [ ] 複合主鍵完整提供
- [ ] 無任何 `$wpdb`、Service 呼叫、寫入操作
- [ ] 無讀取 `$this->queryResult`（那屬 readmodel-then）
