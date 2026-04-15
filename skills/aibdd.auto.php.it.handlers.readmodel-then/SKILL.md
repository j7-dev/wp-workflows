---
name: aibdd.auto.php.it.handlers.readmodel-then
description: >
  處理 Then 步驟中驗證 Query 回傳結果（$this->queryResult）的 handler 參考文件。觸發關鍵字：查詢結果應、應包含、第 X 個應為。
  非 user-invocable，由 /aibdd.auto.php.it.red 在實作測試方法時載入。
---

# Handler: readmodel-then

## Trigger 辨識

本 handler 適用於 **Then** 步驟中驗證「已執行 Query 的結果」：

- 「**查詢結果應**包含進度 80，狀態為 "進行中"」
- 「查詢結果**應包含** 2 個商品」
- 「**第一個**商品的 ID **應為** "PROD-001"」
- 「查詢結果應為空」

關鍵字：`查詢結果應`、`應包含`、`第 X 個應為`、`應為空`

## 任務

讀取 `$this->queryResult` 進行欄位/屬性斷言。**禁止重新呼叫 Service 或 Repository**。

## 與其他 Handler 的區別

| 項目 | readmodel-then | aggregate-then | success-failure |
|---|---|---|---|
| 資料來源 | `$this->queryResult` | Repository（DB） | `$this->lastError` |
| 前置條件 | **必須**是 Query | 可為 Command / fixture | 任何操作後 |
| 是否查 DB | 否 | 是 | 否 |
| 驗證對象 | Query 回傳物件/陣列的內容 | Aggregate 屬性 | 操作成功/失敗 |

## 實作流程

1. **確認 `$this->queryResult` 非 null**：`$this->assertNotNull($this->queryResult);`
2. **依結果型態斷言**：
   - 單一物件：使用 getter 斷言屬性。
   - 陣列/集合：先 `assertCount`，再逐筆驗證。
3. **中文狀態轉 Enum**：與 aggregate-then 一致。
4. **禁止重查**：不得再呼叫 `$this->services->xxx` 或 `$this->repos->xxx`。

## BDD 模式與程式碼範例

### 單一記錄驗證

```gherkin
Then 查詢結果應包含進度 80，狀態為 "進行中"
```

```php
$this->assertNotNull($this->queryResult);
$this->assertSame(80, $this->queryResult->getProgress());
$this->assertSame('IN_PROGRESS', $this->queryResult->getStatus());
```

### 列表數量驗證

```gherkin
Then 查詢結果應包含 2 個商品
```

```php
$this->assertIsArray($this->queryResult);
$this->assertCount(2, $this->queryResult);
```

### 列表個別項目驗證

```gherkin
And 第一個商品的 ID 應為 "PROD-001"，數量為 2
And 第二個商品的 ID 應為 "PROD-002"，數量為 1
```

```php
$this->assertSame('PROD-001', $this->queryResult[0]->getProductId());
$this->assertSame(2, $this->queryResult[0]->getQuantity());

$this->assertSame('PROD-002', $this->queryResult[1]->getProductId());
$this->assertSame(1, $this->queryResult[1]->getQuantity());
```

### DataTable 列表驗證

```gherkin
Then 查詢結果應包含以下課程:
  | 課程 ID | 標題       | 進度 |
  | 1       | React 入門 | 80   |
  | 2       | Vue 進階   | 0    |
```

```php
$expected = [
    ['課程 ID' => 1, '標題' => 'React 入門', '進度' => 80],
    ['課程 ID' => 2, '標題' => 'Vue 進階',   '進度' => 0],
];
$this->assertIsArray($this->queryResult);
$this->assertCount(count($expected), $this->queryResult);
foreach ($expected as $i => $row) {
    $item = $this->queryResult[$i];
    $this->assertSame((int) $row['課程 ID'], $item->getCourseId());
    $this->assertSame($row['標題'], $item->getTitle());
    $this->assertSame((int) $row['進度'], $item->getProgress());
}
```

### 空結果驗證

```gherkin
Then 查詢結果應為空
```

```php
$this->assertTrue(
    $this->queryResult === null
    || (is_array($this->queryResult) && count($this->queryResult) === 0),
    '預期查詢結果為空，但實際有資料'
);
```

### 含分頁結構驗證

```gherkin
Then 查詢結果的總數應為 25
And 當前頁資料應為 10 筆
```

```php
$this->assertNotNull($this->queryResult);
$this->assertSame(25, $this->queryResult->getTotal());
$this->assertCount(10, $this->queryResult->getItems());
```

### 包含性驗證（不在意順序）

```gherkin
Then 查詢結果應包含商品 "PROD-001"
```

```php
$this->assertIsArray($this->queryResult);
$productIds = array_map(fn ($item) => $item->getProductId(), $this->queryResult);
$this->assertContains('PROD-001', $productIds);
```

## 中文狀態對應表

| 中文 | Enum 值 |
|---|---|
| 進行中 | `IN_PROGRESS` |
| 已完成 | `COMPLETED` |
| 未開始 | `NOT_STARTED` |
| 已付款 | `PAID` |
| 待付款 | `PENDING` |
| 已取消 | `CANCELLED` |

## 共用規則 R1-R6

- **R1（禁止重查）**：禁止呼叫 `$this->services->xxx`、`$this->repos->xxx`；只讀 `$this->queryResult`。
- **R2（欄位名 = getter）**：欄位取值一律透過 Model getter method（`getXxx()`），禁止以陣列 key 讀取物件屬性。
- **R3（中文 → Enum）**：狀態字面值依對應表轉換。
- **R4（列表雙驗證）**：列表同時驗證「數量」（`assertCount`）與「內容」（逐項 getter 斷言）。
- **R5（唯讀）**：禁止修改 `$this->queryResult`（包含重指派、排序）。
- **R6（assertIsArray 先行）**：對列表類結果，先 `assertIsArray` 再 `assertCount`，避免 null 造成誤導錯誤。

## 完成條件

- [ ] 所有驗證僅讀取 `$this->queryResult`
- [ ] 列表類結果均有 `assertCount` + 內容逐項驗證
- [ ] 單一物件類結果前置 `assertNotNull`
- [ ] 中文狀態已轉為 Enum 常數
- [ ] 無任何 Service / Repository 呼叫
- [ ] 無修改 `$this->queryResult`
