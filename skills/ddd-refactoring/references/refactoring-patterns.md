# DDD Refactoring Patterns

五種常用重構 pattern,按風險由低到高排列。每個 pattern 都是可獨立執行、可獨立驗證的單位。

---

## 策略 A:提取 DTO(風險:極低)

將散亂的 array 操作提取為強型別 DTO。

**適用場景**:方法之間傳遞 `$data['key']` 的 array

**識別訊號**
- 方法簽名 `array $data`
- 同一組 key 在多處被讀取
- 改一個 key 名稱要翻遍整個 codebase

**步驟**
1. 識別重複傳遞的資料結構
2. 建立 `Domain/{Context}/DTOs/XxxDTO.php`
3. 加上 `from_array()` 工廠方法與 `to_array()` 輸出方法
4. 逐一替換原有 array 為 DTO(由外而內:先換 return type,再換參數 type)

**驗收**
- PHPStan level 上升不報錯
- E2E 測試全綠

---

## 策略 B:提取 Enum(風險:極低)

將魔術字串替換為 PHP 8.1 enum。

**適用場景**:`if ($status === 'active')` 之類的字串比對

**識別訊號**
- 散落的字串比對
- 有限集合的字串值(status、type、role)
- switch / match 字串

**步驟**
1. 收集所有可能的值
2. 建立 `Domain/{Context}/Enums/XxxEnum.php`
3. 替換所有比對為 enum case
4. 資料庫層面保留 string,在邊界轉換

**驗收**
- 所有比對點都用 `=== XxxEnum::ACTIVE`
- IDE 的 usage search 找不到殘留的魔術字串

---

## 策略 C:提取 Service(風險:中)

將 Controller / Hook callback 中的業務邏輯搬到獨立的 Service。

**適用場景**:God Class、Controller 裡有大量業務邏輯

**識別訊號**
- Controller 方法超過 50 行
- Hook callback 內含多個 if/else 商業判斷
- 商業邏輯與 HTTP / WP Hook 綁死,無法單獨測試

**步驟**
1. 識別 Controller 中的業務邏輯區塊
2. 建立 `Application/Services/XxxService.php` 或 `Domain/{Context}/Services/XxxService.php`
3. 將邏輯搬到 Service,Controller 只負責呼叫
4. 確保依賴注入而非直接 `new`(用 DI container 或透過 constructor 注入)

**決策:Application Service vs Domain Service**
- 編排多個 Aggregate 的用例 → Application Service
- 純領域邏輯、無法放進單一 Entity → Domain Service

**驗收**
- Controller 瘦身為 5-10 行
- Service 可單獨單元測試

---

## 策略 D:提取 Repository(風險:中)

將散落的 `$wpdb` 查詢統一到 Repository。

**適用場景**:多處直接 `$wpdb->get_results()` 操作同一張表

**識別訊號**
- 相同的 SQL 片段散落多處
- 查詢結果直接以 `stdClass` 或 array 使用
- 想加快取時不知從何下手

**步驟**
1. 找出所有對同一張表 / meta 的查詢
2. 建立 `Infrastructure/Repositories/XxxRepository.php`
3. Domain 層定義 Repository 介面 `Domain/{Context}/Repositories/XxxRepositoryInterface.php`
4. Infrastructure 層實作介面,統一查詢邏輯,回傳 Entity 或 DTO
5. 逐一替換散落的查詢

**WordPress 特有考量**
- `$wpdb` 的 prepare / prefix 統一處理
- post_meta / user_meta 的 key 封裝在 Repository 內部
- Custom Table vs CPT 選擇在 Repository 實作中決定

**驗收**
- 整個 codebase grep 不到直接的 `$wpdb->` 呼叫(除了 Repository 本身)
- 可以為 Repository 寫 Fake 實作做單元測試

---

## 策略 E:建立 Entity(風險:中高)

將核心業務概念建模為 Entity。

**適用場景**:業務邏輯圍繞某個核心概念(訂單、課程、會員等)

**識別訊號**
- 多個 Service 操作同一組資料
- 一致性規則散落在不同地方
- 改變業務規則需要同步修改多處

**步驟**
1. 從 `./specs` 確認 Entity 的屬性與行為
2. 建立 `Domain/{Context}/Entities/XxxEntity.php`
3. 將相關業務邏輯封裝到 Entity 方法中(讓資料與行為同居)
4. Repository 回傳 Entity 而非 raw data
5. 以 Entity 的方法替代散落的 Service 邏輯

**關鍵約束**
- Entity 不依賴 WordPress 函式(不 `get_post()` / 不 `$wpdb`)
- Entity 的建構子保證不變量(invariant)
- 狀態變更透過方法而非 setter

**驗收**
- Entity 100% 可用 PHPUnit 單元測試(不需 wp-env)
- 業務規則在 Entity 中可一目了然

---

## Pattern 選擇決策樹

```
發現 Code Smell...
├─ 散亂的 array → 策略 A (DTO)
├─ 魔術字串 → 策略 B (Enum)
├─ Controller / Hook 太肥 → 策略 C (Service)
├─ 散落的 $wpdb 查詢 → 策略 D (Repository)
└─ 核心概念缺乏建模 → 策略 E (Entity)
```

## 參考

- Code Smell 識別 → `code-smell-catalog.md`
- 多個 pattern 的執行順序 → `refactoring-sequence.md`
- PHP 實例 → `before-after-examples.md`
