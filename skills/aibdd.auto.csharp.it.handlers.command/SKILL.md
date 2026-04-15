---
name: aibdd.auto.csharp.it.handlers.command
description: >
  當在 Gherkin 中撰寫寫入操作步驟（Given 已完成 / When 執行中），務必參考此規範。
  使用 HttpClient 發送 HTTP POST/PUT/PATCH/DELETE 請求。
---

# Handler: command（C# Integration Test）

使用 HttpClient（來自 WebApplicationFactory）發送 HTTP 寫入請求，執行系統狀態變更操作。

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

Given/When 語句執行**寫入操作**（Command）。

**識別規則**：
- 動作會修改系統狀態
- 描述「執行某個動作」或「已完成某個動作」
- Given 常見過去式：「已訂閱」「已完成」「已建立」「已添加」「已註冊」
- When 常見現在式：「更新」「提交」「建立」「刪除」「添加」「移除」

**通用判斷**：如果語句是修改系統狀態的操作且不需要回傳值，就使用此 Handler。

## 與 Query Handler 的區別

| | Command | Query |
|---|---|---|
| HTTP 方法 | POST / PUT / PATCH / DELETE | GET |
| 系統狀態 | 修改 | 不修改 |
| Response 驗證 | 不驗證（交給 Then） | 不驗證（交給 Then） |
| 用途 | 執行操作 | 讀取資料 |

## Given vs When 的 Command 差異

| | Given + Command | When + Command |
|---|---|---|
| 目的 | 建立前置資料（透過 API） | 測試目標操作 |
| 失敗處理 | 不預期失敗 | 可能成功或失敗 |

## 實作流程

1. 從 `Ids` 字典取得用戶 ID（`Ids[userName].ToString()!`）
2. 使用 `_jwtHelper.GenerateToken(userId)` 產生 JWT Token
3. 構建 Request Body（欄位名 = `api.yml` schemas）
4. 使用 `JsonSerializer.Serialize()` 序列化為 JSON
5. 建立 `StringContent`（指定 `application/json`）
6. 設定 `Authorization` header（`Bearer` token）
7. 執行 HTTP 請求（`PostAsync` / `PutAsync` / `PatchAsync` / `DeleteAsync`）
8. 儲存 response 到 `_ctx["LastResponse"]`
9. **不做 assertion** — 驗證交給 Then handler

## 程式碼模式

### 共用基礎設施（Constructor Injection）

```csharp
[Binding]
public class CommandSteps
{
    private readonly ScenarioContext _ctx;
    private readonly HttpClient _client;
    private readonly AppDbContext _dbContext;
    private readonly JwtHelper _jwtHelper;

    public CommandSteps(ScenarioContext ctx)
    {
        _ctx = ctx;
        _client = ctx.Get<HttpClient>("HttpClient");
        _dbContext = ctx.Get<AppDbContext>("DbContext");
        _jwtHelper = ctx.Get<JwtHelper>("JwtHelper");
    }

    private Dictionary<string, object> Ids => _ctx.Get<Dictionary<string, object>>("Ids");
}
```

### When + Command（單一操作）

```csharp
[When(@"用戶 ""(.*)"" 更新課程 (.*) 的影片進度為 (.*)%")]
public async Task WhenUpdateProgress(string userName, int lessonId, int progress)
{
    var userId = Ids[userName].ToString()!;
    var token = _jwtHelper.GenerateToken(userId);
    var requestBody = new { lessonId, progress };
    var content = new StringContent(
        JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);
    var response = await _client.PostAsync(
        "/api/v1/lesson-progress/update-video-progress", content);
    _ctx["LastResponse"] = response;
}
```

### DataTable + Command（批量操作）

```csharp
[When(@"用戶 ""(.*)"" 批量更新以下商品數量：")]
public async Task WhenBatchUpdate(string userName, Table table)
{
    var userId = Ids[userName].ToString()!;
    var token = _jwtHelper.GenerateToken(userId);
    var items = table.Rows.Select(row => new {
        productId = row["productId"],
        quantity = int.Parse(row["quantity"])
    }).ToList();
    var content = new StringContent(
        JsonSerializer.Serialize(new { items }), Encoding.UTF8, "application/json");
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);
    var response = await _client.PostAsync("/api/v1/cart/batch-update", content);
    _ctx["LastResponse"] = response;
}
```

### Given + Command（前置操作）

```csharp
[Given(@"用戶 ""(.*)"" 已訂閱課程 (.*)")]
public async Task GivenUserSubscribed(string userName, int courseId)
{
    var userId = Ids[userName].ToString()!;
    var token = _jwtHelper.GenerateToken(userId);
    var requestBody = new { courseId };
    var content = new StringContent(
        JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);
    var response = await _client.PostAsync("/api/v1/subscriptions", content);
    _ctx["LastResponse"] = response;
}
```

## API 呼叫模式

| 項目 | 模式 |
|------|------|
| HTTP Client | `_client`（HttpClient，來自 WebApplicationFactory） |
| Auth | `_jwtHelper.GenerateToken(userId)` → `new AuthenticationHeaderValue("Bearer", token)` |
| POST | `await _client.PostAsync(url, content)` |
| PUT | `await _client.PutAsync(url, content)` |
| PATCH | `await _client.PatchAsync(url, content)` |
| DELETE | `await _client.DeleteAsync(url)` |
| Path Params | C# 字串插值：`$"/api/v1/lessons/{lessonId}"` |
| Request Body | `JsonSerializer.Serialize(new { ... })` → `new StringContent(..., Encoding.UTF8, "application/json")` |
| Response 儲存 | `_ctx["LastResponse"] = response` |

### DELETE 帶 Body 的特殊情況

```csharp
var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/items/{itemId}")
{
    Content = new StringContent(
        JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
};
var response = await _client.SendAsync(request);
_ctx["LastResponse"] = response;
```

## 共用規則

1. **R1: Command 不驗 Response** — 只儲存 response 到 `_ctx["LastResponse"]`，assertion 交給 Then handler
2. **R2: 欄位名 = api.yml** — Request Body 的 property name 必須與 `api.yml` schemas 一致（camelCase）
3. **R3: 儲存 response** — `_ctx["LastResponse"] = response`，型別為 `HttpResponseMessage`
4. **R4: ID 從 Ids 字典取得** — `Ids[userName].ToString()!`，不硬編碼 ID
5. **R5: Given Command 不預期失敗** — 前置操作應該總是成功，不需要 try-catch
