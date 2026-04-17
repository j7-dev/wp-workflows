# PHP Code Smell Catalog

針對 PHP / WordPress 專案常見的程式碼異味,按嚴重度分級。診斷階段用來為重構任務排序。

## 嚴重度分級表

| 嚴重度 | Code Smell | 症狀 |
|--------|-----------|------|
| 高 | God Class | 單一類別超過 500 行,負責多種職責 |
| 高 | 無分層 | 業務邏輯散落在 Controller / Hook callback 中 |
| 中 | Primitive Obsession | 大量 array 傳遞取代 DTO / Value Object |
| 中 | Feature Envy | 方法大量操作其他類別的資料 |
| 低 | Data Clumps | 多個方法重複傳遞同一組參數 |
| 低 | Shotgun Surgery | 修改一個功能需要改動多個檔案 |
| 低 | Divergent Change | 同一個類別因為不同原因頻繁被修改 |
| 低 | Long Parameter List | 方法參數超過 4 個 |

## 診斷要點

### God Class 識別

- 類別行數 > 500
- 方法數 > 20
- 同時處理 HTTP request、資料驗證、業務邏輯、資料存取
- WordPress 專案特有:單一 Plugin 主類別塞滿所有功能

### 無分層識別

- Controller 直接 `$wpdb->get_results()`
- Hook callback 內含大量業務判斷
- View (template) 直接處理商業邏輯

### Primitive Obsession 識別

- 方法簽名大量 `array $data` 或 `string $status`
- 散落的魔術字串 `'active'` / `'pending'` / `'completed'`
- 同一組 key(`user_id`, `user_name`, `user_email`) 在多處傳遞

### Feature Envy 識別

- `$foo->bar->baz->qux` 的長連鎖調用
- 方法幾乎只操作另一個類別的屬性
- Getter 被用來實作商業邏輯,而非封裝在擁有資料的類別中

## 診斷產出格式

針對每個發現的 smell,產出:

```
Smell: {名稱}
嚴重度: 高/中/低
位置: {檔案路徑與行號}
症狀: {具體描述}
建議 Pattern: {對應的重構策略代號,參見 refactoring-patterns.md}
預估影響範圍: {涉及哪些檔案}
```

## 參考

- 重構 pattern 詳細步驟 → `refactoring-patterns.md`
- 重構順序策略 → `refactoring-sequence.md`
- PHP 實例對照 → `before-after-examples.md`
