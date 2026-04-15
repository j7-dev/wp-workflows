---
name: aibdd.auto.csharp.it.handlers.aggregate-given
description: >
  當在 Gherkin 測試中進行「Aggregate 初始狀態建立」，「只能」使用此指令。
  使用 EF Core DbContext 直接寫入 DB 建立測試資料。
---

# Handler: aggregate-given（C# Integration Test）

使用 EF Core DbContext 直接寫入資料庫，建立測試所需的初始 Aggregate 狀態。

## 測試框架

| 項目 | 技術 |
|------|------|
| Language | C# 12 / .NET 8+ |
| BDD | SpecFlow 3.9+（Cucumber Expressions） |
| HTTP Client | WebApplicationFactory\<Program\> + HttpClient |
| ORM | Entity Framework Core 8+ |
| Database | PostgreSQL 16（Testcontainers for .NET） |
| DI | Microsoft.Extensions.DependencyInjection（BoDi for SpecFlow） |
| Assertion | FluentAssertions 6+ |
| JSON | System.Text.Json |
| Auth | JWT（System.IdentityModel.Tokens.Jwt） |
| Test Runner | xUnit |
| Test Command | `dotnet test --filter "Category!=Ignore"` |
| Red Failure | HTTP 404 Not Found |

## Trigger 辨識

Given 語句描述 **Aggregate 的存在狀態**，即定義 Aggregate 的屬性值。

**識別規則**：
- 語句中包含實體名詞 + 屬性描述
- 描述「某個東西的某個屬性是某個值」
- 常見句型（非窮舉）：「在...的...為」「的...為」「包含」「存在」「有」

**通用判斷**：如果 Given 是在建立測試的初始資料狀態（而非執行動作），就使用此 Handler。

## 與 Command Handler 的區別

| | aggregate-given | command（Given 用法） |
|---|---|---|
| 目的 | 直接建立 DB 資料（繞過 API） | 透過 API 執行命令 |
| 層級 | DbContext 層（EF Core） | HTTP API 層 |
| 適用時機 | 純前置資料設定 | 測試需要經過完整 API 流程 |

## 實作流程

1. 從 `ScenarioContext` 取得 `AppDbContext`（`_ctx.Get<AppDbContext>("DbContext")`）
2. 識別 Aggregate 名稱（從 TODO 標註或 Gherkin 語意）
3. 從 DBML 提取：屬性、型別、複合 Key、enum
4. 從 Gherkin 提取：Key 值、屬性值
5. 建立 EF Core Entity instance
6. 使用 `dbContext.Add()` 寫入
7. 呼叫 `dbContext.SaveChanges()` 持久化
8. 將 ID 儲存到共享狀態 `Ids` 字典（`Ids["{natural_key}"] = entity.Id`）

## 程式碼模式

### 共用基礎設施（Constructor Injection）

```csharp
[Binding]
public class AggregateGivenSteps
{
    private readonly ScenarioContext _ctx;
    private readonly HttpClient _client;
    private readonly AppDbContext _dbContext;
    private readonly JwtHelper _jwtHelper;

    public AggregateGivenSteps(ScenarioContext ctx)
    {
        _ctx = ctx;
        _client = ctx.Get<HttpClient>("HttpClient");
        _dbContext = ctx.Get<AppDbContext>("DbContext");
        _jwtHelper = ctx.Get<JwtHelper>("JwtHelper");
    }

    private Dictionary<string, object> Ids => _ctx.Get<Dictionary<string, object>>("Ids");
}
```

### 單一 Entity 建立

```csharp
[Given(@"用戶 ""(.*)"" 的購物車中商品 ""(.*)"" 的數量為 (.*)")]
public void GivenCartItem(string userName, string productId, int quantity)
{
    var userId = Ids[userName].ToString()!;
    var dbContext = _ctx.Get<AppDbContext>("DbContext");
    var cartItem = new CartItem
    {
        UserId = userId,
        ProductId = productId,
        Quantity = quantity
    };
    dbContext.CartItems.Add(cartItem);
    dbContext.SaveChanges();
}
```

### DataTable 批量建立

使用 SpecFlow 的 `Table` 參數搭配 `table.Rows` 迭代，一次建立多筆資料。

```csharp
[Given(@"系統中有以下用戶：")]
public void GivenUsersExist(Table table)
{
    var dbContext = _ctx.Get<AppDbContext>("DbContext");
    foreach (var row in table.Rows)
    {
        var user = new User
        {
            Id = row["userId"],
            Name = row["name"],
            Email = row["email"]
        };
        dbContext.Users.Add(user);
        Ids[row["name"]] = user.Id;
    }
    dbContext.SaveChanges();
}
```

### DocString（多行文字）

```csharp
[Given(@"用戶 ""(.*)"" 的個人簡介為：")]
public void GivenUserBio(string userName, string docString)
{
    var userId = Ids[userName].ToString()!;
    var dbContext = _ctx.Get<AppDbContext>("DbContext");
    var profile = dbContext.UserProfiles.First(p => p.UserId == userId);
    profile.Bio = docString;
    dbContext.UserProfiles.Update(profile);
    dbContext.SaveChanges();
}
```

## 關鍵模式

### 複合主鍵推斷

從 Gherkin 的關係詞推斷 DBML 中的複合主鍵結構：

| 關係詞 | Gherkin 範例 | 複合 Key |
|-------|------------|---------|
| 在 | 用戶 "Alice" 在課程 1 | (UserId, LessonId) |
| 對 | 用戶 "Alice" 對訂單 "ORDER-123" | (UserId, OrderId) |
| 與 | 用戶 "Alice" 與用戶 "Bob" | (UserIdA, UserIdB) |
| 於 | 商品 "MacBook" 於商店 "台北店" | (ProductId, StoreId) |

### 中文狀態映射

Gherkin 中的中文業務術語需映射到 DBML enum 值：

| 中文 | Enum | 情境 |
|-----|------|-----|
| 進行中 | InProgress | 進度、狀態 |
| 已完成 | Completed | 進度、狀態 |
| 未開始 | NotStarted | 進度、狀態 |
| 已付款 | Paid | 訂單 |
| 待付款 | Pending | 訂單 |

建議使用 Dictionary 集中管理映射：

```csharp
private static readonly Dictionary<string, string> StatusMap = new()
{
    ["進行中"] = "InProgress",
    ["已完成"] = "Completed",
    ["未開始"] = "NotStarted",
    ["已付款"] = "Paid",
    ["待付款"] = "Pending"
};
```

## 共用規則

1. **R1: 必須查詢 DBML** — 不可憑空猜測屬性名稱和型別，須對照 `erm.dbml` 定義
2. **R2: 使用 EF Core Entity** — 不可使用 anonymous object 或 Dictionary 替代，必須使用強型別 Entity class
3. **R3: 透過 DbContext** — 使用 `dbContext.Set<T>().Add()` 或 `dbContext.Add()`，不可使用 raw SQL
4. **R4: 中文狀態映射** — 中文業務術語須映射為 enum 值（查 DBML note）
5. **R5: 提供完整複合 Key** — 缺少任一 key 欄位會導致 `SaveChanges()` 拋出 `DbUpdateException`
6. **R6: 儲存 ID 到 Ids 字典** — `Ids[naturalKey] = entity.Id`，供後續 Command/Query/Then handler 使用
7. **R7: 檢查依賴 ID** — 有外鍵的 Entity，先確認依賴的 ID 已存在於 `Ids` 字典
8. **R8: 使用 DbContext.Update() 處理 upsert** — 若資料可能已存在，使用 `Update()` 避免重複插入失敗
