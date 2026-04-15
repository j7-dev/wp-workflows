---
name: aibdd.auto.csharp.it.handlers.readmodel-then
description: >
  當在 Gherkin 測試中驗證「Query 回傳結果」時，「只能」使用此指令。
  讀取 _ctx["LastResponse"] 驗證 HTTP Response Body。
---

# Handler: readmodel-then（C# Integration Test）

讀取 When 階段儲存的 `HttpResponseMessage`，驗證 Query API 回傳的 Response Body 內容。

## 測試框架

| 項目 | 技術 |
|------|------|
| Language | C# 12 / .NET 8+ |
| BDD | SpecFlow 3.9+ |
| HTTP | WebApplicationFactory + HttpClient |
| JSON | System.Text.Json |
| Assertion | FluentAssertions 6+ |

## Trigger 辨識

Then 語句緊跟在 Query When 之後，驗證 **API 回傳的資料內容**。

**識別規則**：
- 描述「查詢結果應包含」「應顯示」「應回傳」
- 與 `@query` / `@readmodel` 場景綁定
- 驗證的是 HTTP Response Body，不是 DB 狀態

## 與 Aggregate-Then 的區別

| | readmodel-then | aggregate-then |
|---|---|---|
| 驗證對象 | HTTP Response Body | DB 持久化狀態 |
| 資料來源 | `_ctx["LastResponse"]` | `AppDbContext` 查詢 |
| 對應的 When | query handler | command handler |

## 實作流程

1. 從 `_ctx` 取出儲存的 `HttpResponseMessage`（key: `"LastResponse"`）
2. `await response.Content.ReadAsStringAsync()` 取得 body 字串
3. `JsonSerializer.Deserialize<JsonElement>(body)` 解析 JSON
4. 處理 envelope（若 API 包裝在 `data` / `items` 欄位下）
5. 用 FluentAssertions 驗證欄位與值（欄位名必須符合 `api.yml` response schema）

## 程式碼模式

### 基本 Step Class 結構

```csharp
using System.Text.Json;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace ProjectName.IntegrationTests.Steps.Lesson.ReadModelThen;

[Binding]
public class LessonProgressReadModelSteps
{
    private readonly ScenarioContext _ctx;
    public LessonProgressReadModelSteps(ScenarioContext ctx) => _ctx = ctx;
}
```

### 單一欄位驗證

```csharp
[Then(@"查詢結果應包含進度 (.*)，狀態為 ""(.*)""")]
public async Task ThenResultContains(int progress, string status)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);

    var statusMap = new Dictionary<string, string>
    {
        ["進行中"] = "IN_PROGRESS",
        ["已完成"] = "COMPLETED",
        ["未開始"] = "NOT_STARTED"
    };
    var expectedStatus = statusMap.GetValueOrDefault(status, status);

    data.GetProperty("progress").GetInt32().Should().Be(progress,
        "預期進度 {0}", progress);
    data.GetProperty("status").GetString().Should().Be(expectedStatus,
        "預期狀態 {0}", expectedStatus);
}
```

### List 數量驗證（含 envelope 處理）

```csharp
[Then(@"查詢結果應包含 (.*) 筆記錄")]
public async Task ThenResultCount(int expectedCount)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);

    // 處理常見 envelope：{"data": [...]} 或 {"items": [...]}
    var items = ExtractArray(data);
    items.GetArrayLength().Should().Be(expectedCount);
}

private static JsonElement ExtractArray(JsonElement root)
{
    if (root.ValueKind == JsonValueKind.Array) return root;
    if (root.TryGetProperty("data", out var d) && d.ValueKind == JsonValueKind.Array) return d;
    if (root.TryGetProperty("items", out var i) && i.ValueKind == JsonValueKind.Array) return i;
    if (root.TryGetProperty("results", out var r) && r.ValueKind == JsonValueKind.Array) return r;
    throw new InvalidOperationException("Response 不含可識別的陣列欄位（data / items / results）");
}
```

### DataTable 逐列驗證

```csharp
[Then(@"查詢結果應包含以下記錄：")]
public async Task ThenResultContainsRecords(Table table)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);
    var items = ExtractArray(data);

    items.GetArrayLength().Should().BeGreaterThanOrEqualTo(table.RowCount,
        "Response 陣列長度 {0}，Gherkin 預期至少 {1}", items.GetArrayLength(), table.RowCount);

    foreach (var row in table.Rows)
    {
        var matched = items.EnumerateArray().Any(item =>
            table.Header.All(header =>
                item.TryGetProperty(header, out var prop) &&
                prop.ToString() == row[header]
            ));

        matched.Should().BeTrue(
            "找不到符合 Gherkin row 的項目: {0}",
            string.Join(", ", table.Header.Select(h => $"{h}={row[h]}")));
    }
}
```

### 巢狀物件驗證

```csharp
[Then(@"用戶 ""(.*)"" 的購物車總金額應為 (.*)")]
public async Task ThenCartTotalShouldBe(string userName, decimal expectedTotal)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);

    // 假設 response shape: { "summary": { "total": 1234.5 } }
    var total = data.GetProperty("summary").GetProperty("total").GetDecimal();
    total.Should().Be(expectedTotal);
}
```

### 欄位不存在驗證

```csharp
[Then(@"查詢結果不應包含 ""(.*)"" 欄位")]
public async Task ThenResultNotContainField(string fieldName)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);

    data.TryGetProperty(fieldName, out _).Should().BeFalse(
        "Response 不應含有 {0} 欄位（敏感欄位過濾）", fieldName);
}
```

## 關鍵模式

### JsonElement 型別安全取值

```csharp
// 整數
var id = data.GetProperty("id").GetInt32();
var count = data.GetProperty("count").GetInt64();

// 字串
var name = data.GetProperty("name").GetString();

// 小數
var price = data.GetProperty("price").GetDecimal();

// 布林
var isActive = data.GetProperty("isActive").GetBoolean();

// 可選欄位（Safe）
var description = data.TryGetProperty("description", out var desc)
    ? desc.GetString() : null;
```

### 欄位名慣例

C# / ASP.NET Core 預設 JSON 序列化為 **camelCase**（`lessonId`, `newLeadsThisMonth`）。`api.yml` 中的 schema 欄位名應保持一致。

```csharp
// ✅ camelCase（與 api.yml 一致）
data.GetProperty("lessonId").GetInt32()

// ❌ snake_case（.NET 預設不會這樣序列化）
data.GetProperty("lesson_id").GetInt32()
```

若後端明確使用 `snake_case`（透過 `JsonNamingPolicy.SnakeCaseLower`），測試中也要對應。

## 共用規則

1. **R1: 不重新呼叫 API** — 使用 When 中儲存的 `_ctx["LastResponse"]`，不重新發請求
2. **R2: 欄位名 = api.yml response schema** — Response key 以 `api.yml` 為 SSOT
3. **R3: 中文狀態映射到 enum/DB 值** — 與 aggregate-given / aggregate-then 一致
4. **R4: 處理 envelope** — 若 API 回傳 `{"data": [...]}`，需先解包
5. **R5: List 驗證要查數量 AND 內容** — 不能只看 count，要逐項確認
6. **R6: 使用 JsonElement 型別安全 API** — `GetInt32()` / `GetString()` 等，不要用字串 parse
7. **R7: 可選欄位用 TryGetProperty** — 避免 `KeyNotFoundException`

## 完成條件

- 所有 Gherkin Then（readmodel 類型）已實作
- 欄位名與 `api.yml` response schemas 完全一致
- Envelope 處理邏輯抽取為 helper（避免重複）
- DataTable 驗證支援逐列比對
- 測試訊息具診斷價值
