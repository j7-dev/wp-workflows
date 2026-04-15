---
name: aibdd.auto.php.it.handlers.command
description: >
  處理 Given/When 步驟中執行寫入操作（Command）的 handler 參考文件。觸發關鍵字：已訂閱、已建立、已新增、更新、建立、刪除、提交。
  非 user-invocable，由 /aibdd.auto.php.it.red 在實作測試方法時載入。
---

# Handler: command

## Trigger 辨識

本 handler 適用於呼叫 **Service 寫入方法** 的步驟：

- **Given 過去式**（描述已發生的業務行為）：
  - 「用戶 Alice **已訂閱**課程 1」
  - 「訂單 ORD-001 **已建立**」
  - 「管理者 Bob **已新增**商品 PROD-001」
- **When 現在式**（當下觸發的業務行為，可能失敗）：
  - 「用戶 Alice **更新**課程 1 的影片進度為 80%」
  - 「管理者 **建立**新商品 PROD-002」
  - 「用戶 Alice **刪除**購物車中的商品 PROD-001」
  - 「用戶 Alice **提交**訂單」

關鍵字（Given）：`已訂閱`、`已建立`、`已新增`、`已更新`、`已刪除`
關鍵字（When）：`更新`、`建立`、`新增`、`刪除`、`提交`、`取消`、`完成`

## 任務

直接呼叫 `$this->services->xxx->method(...)`：
- **Given + Command**：不預期失敗，無需 try/catch
- **When + Command**：可能失敗，必須 try/catch 將錯誤存入 `$this->lastError`

## 與其他 Handler 的區別

| 項目 | Command | Query |
|---|---|---|
| 系統狀態 | 修改 | 不修改 |
| Service 方法 | `updateXxx`、`createXxx`、`deleteXxx`、`subscribeXxx` | `getXxx`、`findXxx`、`listXxx` |
| 儲存位置 | `$this->lastError`（失敗時） | `$this->queryResult` |
| 驗證方式 | 由 success-failure handler | 由 readmodel-then handler |

另與 `aggregate-given` 的差異：aggregate-given 透過 Repository.save() 建立資料（fixture），command 則呼叫 Service 觸發完整業務流程。

## 實作流程

1. **判斷 Given vs When**：依關鍵字與時機選擇是否加 try/catch。
2. **從 `$this->ids` 取得依賴 ID**：`$userId = $this->ids['Alice'];`
3. **呼叫 Service 方法**：方法名 = `api.yml` 的 `operationId`（camelCase）。
4. **When 必加 try/catch**：捕捉 `\Throwable` 存入 `$this->lastError`。
5. **不驗證回傳值**：驗證交給 Then 步驟（aggregate-then / readmodel-then / success-failure）。

## BDD 模式與程式碼範例

### Given + Command（不預期失敗）

```gherkin
Given 用戶 "Alice" 已訂閱課程 1
```

```php
$userId = $this->ids['Alice'];
$this->services->subscription->subscribe($userId, 1);
```

```gherkin
Given 用戶 "Alice" 已建立訂單 "ORD-001"，包含商品 "PROD-001" 數量 2
```

```php
$userId = $this->ids['Alice'];
$orderId = $this->services->order->create($userId, [
    ['productId' => 'PROD-001', 'quantity' => 2],
]);
$this->ids['ORD-001'] = $orderId;
```

### When + Command（可能失敗）

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 80%
```

```php
$userId = $this->ids['Alice'];
try {
    $this->services->lesson->updateVideoProgress($userId, 1, 80);
} catch (\Throwable $e) {
    $this->lastError = $e;
}
```

```gherkin
When 用戶 "Alice" 提交訂單
```

```php
$userId = $this->ids['Alice'];
try {
    $this->services->order->submit($userId);
} catch (\Throwable $e) {
    $this->lastError = $e;
}
```

### 含 DataTable 的 Command

```gherkin
When 管理者建立以下商品:
  | 商品 ID   | 名稱       | 價格 |
  | PROD-001 | iPhone 16  | 30000 |
  | PROD-002 | MacBook    | 60000 |
```

```php
$products = [
    ['商品 ID' => 'PROD-001', '名稱' => 'iPhone 16', '價格' => 30000],
    ['商品 ID' => 'PROD-002', '名稱' => 'MacBook',   '價格' => 60000],
];
try {
    foreach ($products as $row) {
        $this->services->product->create(
            id: $row['商品 ID'],
            name: $row['名稱'],
            price: (int) $row['價格'],
        );
    }
} catch (\Throwable $e) {
    $this->lastError = $e;
}
```

## IntegrationTestCase 基類（參考）

所有 Test class 均繼承此基類：

```php
abstract class IntegrationTestCase extends \Yoast\WPTestUtils\WPIntegration\TestCase
{
    protected ?\Throwable $lastError = null;
    protected mixed $queryResult = null;
    protected array $ids = [];
    protected object $repos;
    protected object $services;

    abstract protected function configure_dependencies(): void;

    public function set_up(): void {
        parent::set_up();
        $this->lastError = null;
        $this->queryResult = null;
        $this->ids = [];
        $this->repos = new \stdClass();
        $this->services = new \stdClass();
        $this->configure_dependencies();
    }
}
```

## 共用規則 R1-R7

- **R1（不驗證回傳）**：Command 執行後不做斷言，驗證交給 Then 步驟。
- **R2（When 必 try/catch）**：When + Command 必須包 try/catch 儲存 `$this->lastError`。
- **R3（Given 不 try/catch）**：Given + Command 預設成功；若失敗應拋出視為測試環境錯誤。
- **R4（依賴 ID）**：從 `$this->ids` 取得依賴 ID，禁止硬編或另行查詢。
- **R5（Service 方法名）**：一律使用 `api.yml` 的 `operationId`（camelCase）。
- **R6（禁直連 DB）**：禁止在 command handler 內使用 `$wpdb` 或 Repository 繞過 Service。
- **R7（失敗不拋出）**：try/catch 後 **不要** 重新拋出，交由 Then 步驟透過 `assert_operation_*` 驗證。

## 完成條件

- [ ] Given + Command 均有直接 Service 呼叫
- [ ] When + Command 均包含 try/catch 錯誤儲存
- [ ] 所有依賴 ID 皆從 `$this->ids` 取得
- [ ] 無任何直接 `$wpdb` 或 Repository 呼叫（該層屬 aggregate-given）
- [ ] 無任何斷言（斷言屬 Then 步驟）
