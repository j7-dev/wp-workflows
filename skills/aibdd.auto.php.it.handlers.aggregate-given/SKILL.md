---
name: aibdd.auto.php.it.handlers.aggregate-given
description: >
  處理 Given 步驟中建立 Aggregate 初始狀態的 handler 參考文件。觸發關鍵字：「的...為」「包含」「存在」「有」。
  非 user-invocable，由 /aibdd.auto.php.it.red 在實作測試方法時載入。
---

# Handler: aggregate-given

## Trigger 辨識

本 handler 適用於 **Given** 步驟中描述 Aggregate 初始狀態存在的語句：

- 「用戶 Alice 的購物車中商品 PROD-001 的數量**為** 2」
- 「系統中**存在**以下課程」
- 「用戶 Alice **包含**角色 administrator」
- 「課程 1 **有** 5 個章節」

關鍵字：`為`、`包含`、`存在`、`有`、`已建立（描述既有狀態時）`

## 任務

使用 **WP Factory Methods** + **Repository.save()** 將資料寫入真實 WordPress DB，並把自然鍵 → WP ID 映射存入 `$this->ids`，供後續步驟引用。

## 與其他 Handler 的區別

| Handler | 時機 | 目的 | 方法 |
|---|---|---|---|
| **aggregate-given** | Given | 建立初始狀態（fixture） | Factory + Repository.save() |
| command | Given/When | 執行寫入操作（業務行為） | Service.xxx() |
| query | When | 執行讀取操作 | Service.getXxx() → $this->queryResult |
| aggregate-then | Then | 驗證 DB 狀態 | Repository.findXxx() + assert |

aggregate-given 僅負責「讓資料存在」，不觸發任何業務邏輯流程。

## 實作流程

1. **查 DBML**：先確認 entity 的欄位、型別、複合主鍵，禁止猜測欄位名。
2. **建立 WP 實體（如有）**：若需要 User / Post / Term，用 `$this->factory()->xxx->create([...])` 取得 ID。
3. **記錄自然鍵 → ID**：`$this->ids['Alice'] = $userId;`
4. **組裝 Plain PHP Model 物件**：`new LessonProgress($userId, 1, 50, 'IN_PROGRESS')`。
5. **呼叫 Repository.save()**：透過 Repository 抽象層（禁止直接 `$wpdb->insert`）。
6. **處理 DataTable**：若有表格資料，逐列 loop 處理。

## BDD 模式與程式碼範例

### 單一實體建立

```gherkin
Given 用戶 "Alice" 在課程 1 的進度為 50%，狀態為 "進行中"
```

```php
$userId = $this->factory()->user->create(['display_name' => 'Alice']);
$this->ids['Alice'] = $userId;

$progress = new LessonProgress($userId, 1, 50, 'IN_PROGRESS');
$this->repos->lessonProgress->save($progress);
```

### WP Factory Methods（內建於 WPTestUtils）

| Factory | 回傳 | 常用參數 |
|---|---|---|
| `$this->factory()->user->create([...])` | User ID | `display_name`, `user_login`, `user_email`, `role` |
| `$this->factory()->post->create([...])` | Post ID | `post_title`, `post_type`, `post_status`, `post_author` |
| `$this->factory()->term->create([...])` | Term ID | `name`, `slug`, `taxonomy` |
| `$this->factory()->category->create([...])` | Category ID | `name`, `slug` |
| `$this->factory()->attachment->create([...])` | Attachment ID | `post_title`, `post_parent` |

### DataTable 批量建立

```gherkin
Given 系統中有以下用戶:
  | 姓名  | 角色          |
  | Alice | administrator |
  | Bob   | subscriber    |
```

```php
$users = [
    ['姓名' => 'Alice', '角色' => 'administrator'],
    ['姓名' => 'Bob',   '角色' => 'subscriber'],
];
foreach ($users as $row) {
    $userId = $this->factory()->user->create([
        'display_name' => $row['姓名'],
        'role'         => $row['角色'],
    ]);
    $this->ids[$row['姓名']] = $userId;
}
```

### 含依賴關係的 DataTable

```gherkin
Given 用戶 "Alice" 的購物車中有以下商品:
  | 商品 ID   | 數量 |
  | PROD-001 | 2    |
  | PROD-002 | 1    |
```

```php
$userId = $this->ids['Alice'];
$items = [
    ['商品 ID' => 'PROD-001', '數量' => 2],
    ['商品 ID' => 'PROD-002', '數量' => 1],
];
foreach ($items as $row) {
    $item = new CartItem($userId, $row['商品 ID'], (int) $row['數量']);
    $this->repos->cartItem->save($item);
}
```

## 中文狀態對應表

| 中文 | Enum 值 | 使用情境 |
|---|---|---|
| 進行中 | `IN_PROGRESS` | Progress, Status |
| 已完成 | `COMPLETED` | Progress, Status |
| 未開始 | `NOT_STARTED` | Progress, Status |
| 已付款 | `PAID` | Order |
| 待付款 | `PENDING` | Order |
| 已取消 | `CANCELLED` | Order |

## 共用規則 R1-R8

- **R1（必查 DBML）**：欄位名、型別、主鍵必須對照 `specs/*/erm.dbml`，禁止猜測。
- **R2（Plain PHP Model）**：使用強型別 Model 物件，非陣列亦非 `stdClass`。
- **R3（Repository 抽象）**：一律透過 `$this->repos->xxx->save()`，禁止直接 `$wpdb`。
- **R4（中文 → Enum）**：依上表轉換，保持全專案一致。
- **R5（複合主鍵）**：複合主鍵必須完整提供，不得省略任一組成欄位。
- **R6（自然鍵映射）**：ID 存入 `$this->ids["{natural_key}"]`，key 為 Gherkin 可讀的自然鍵。
- **R7（依賴檢查）**：引用其他實體 ID 時，先確認該 key 已在 `$this->ids` 中。
- **R8（upsert 語意）**：`save()` 方法應處理 insert/update 雙情境，避免重複資料。

## 完成條件

- [ ] 所有 Given 狀態語句都有對應的 Factory + Repository.save() 實作
- [ ] 自然鍵 → WP ID 已存入 `$this->ids`
- [ ] 中文狀態已轉為對應 Enum 常數
- [ ] Model 欄位已對照 DBML 驗證
- [ ] DataTable 已完整逐列處理
- [ ] 無任何直接 `$wpdb` 操作
