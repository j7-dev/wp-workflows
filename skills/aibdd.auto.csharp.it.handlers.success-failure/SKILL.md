---
name: aibdd.auto.csharp.it.handlers.success-failure
description: >
  當在 Gherkin 測試中驗證操作成功或失敗時，參考此規範。
  驗證 HTTP status code + error response body。
---

# Handler: success-failure（C# Integration Test）

驗證 HTTP operation 的結果狀態（成功 2xx / 失敗 4xx / 5xx），以及錯誤訊息。

## 測試框架

| 項目 | 技術 |
|------|------|
| Language | C# 12 / .NET 8+ |
| BDD | SpecFlow 3.9+ |
| HTTP | HttpResponseMessage |
| JSON | System.Text.Json |
| Assertion | FluentAssertions 6+ |

## Trigger 辨識

Then 語句驗證操作整體的成功或失敗結果，**不涉及具體回傳資料**。

**識別規則**：
- 語句為「操作成功」「操作失敗」「應回傳錯誤」
- 涉及特定 HTTP status code
- 涉及錯誤訊息內容

這類 step 通常可以跨 feature 共用，放在 `Steps/CommonThen/`。

## 實作流程

1. 從 `_ctx` 取出 `HttpResponseMessage`
2. 驗證 `StatusCode` 屬於 2xx（成功）或 4xx（失敗）
3. 若需驗證錯誤訊息，解析 Response Body 擷取 `message` / `detail` / `error`

## 程式碼模式

### 基本 Step Class 結構

```csharp
using System.Text.Json;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace ProjectName.IntegrationTests.Steps.CommonThen;

[Binding]
public class SuccessSteps
{
    private readonly ScenarioContext _ctx;
    public SuccessSteps(ScenarioContext ctx) => _ctx = ctx;
}

[Binding]
public class FailureSteps
{
    private readonly ScenarioContext _ctx;
    public FailureSteps(ScenarioContext ctx) => _ctx = ctx;
}
```

### 操作成功驗證

```csharp
[Then(@"操作成功")]
public void ThenOperationSucceeds()
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().BeInRange(200, 299,
        "預期成功（2xx），實際 {0}", (int)response.StatusCode);
}
```

### 操作失敗驗證

```csharp
[Then(@"操作失敗")]
public void ThenOperationFails()
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().BeInRange(400, 499,
        "預期失敗（4xx），實際 {0}", (int)response.StatusCode);
}
```

### 特定狀態碼驗證

```csharp
[Then(@"HTTP 狀態碼應為 (.*)")]
public void ThenStatusCodeShouldBe(int expectedCode)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().Be(expectedCode);
}
```

### 錯誤訊息驗證（支援多種欄位名）

```csharp
[Then(@"錯誤訊息應包含 ""(.*)""")]
public async Task ThenErrorMessageContains(string expectedMessage)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();

    var message = ExtractErrorMessage(body);
    message.Should().Contain(expectedMessage,
        "預期錯誤訊息包含 '{0}'，實際: {1}", expectedMessage, message);
}

private static string ExtractErrorMessage(string body)
{
    try
    {
        var data = JsonSerializer.Deserialize<JsonElement>(body);

        // ASP.NET Core ProblemDetails 標準：detail / title
        // 一般自訂錯誤：message / error
        if (data.TryGetProperty("detail", out var detail))
            return detail.GetString() ?? body;
        if (data.TryGetProperty("message", out var msg))
            return msg.GetString() ?? body;
        if (data.TryGetProperty("error", out var error))
            return error.ValueKind == JsonValueKind.String
                ? error.GetString() ?? body
                : error.ToString();
        if (data.TryGetProperty("title", out var title))
            return title.GetString() ?? body;

        return body;
    }
    catch (JsonException)
    {
        return body;
    }
}
```

### 錯誤碼驗證

```csharp
[Then(@"錯誤代碼應為 ""(.*)""")]
public async Task ThenErrorCodeShouldBe(string expectedCode)
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    var body = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);

    var code = data.TryGetProperty("code", out var codeEl) ? codeEl.GetString()
        : data.TryGetProperty("errorCode", out var ecEl) ? ecEl.GetString()
        : null;

    code.Should().Be(expectedCode);
}
```

### 未授權 / 禁止操作

```csharp
[Then(@"應回傳未授權錯誤")]
public void ThenUnauthorized()
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().Be(401);
}

[Then(@"應回傳禁止操作錯誤")]
public void ThenForbidden()
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().Be(403);
}

[Then(@"應回傳資源不存在錯誤")]
public void ThenNotFound()
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().Be(404);
}
```

### 驗證失敗（422 / 400）

```csharp
[Then(@"應回傳驗證錯誤")]
public void ThenValidationError()
{
    var response = _ctx.Get<HttpResponseMessage>("LastResponse");
    ((int)response.StatusCode).Should().Match(code => code == 400 || code == 422);
}
```

## 關鍵模式

### 型別轉換

```csharp
// HttpStatusCode → int（最簡單比較）
((int)response.StatusCode).Should().Be(200);

// 使用 FluentAssertions 的 HttpStatusCode 擴充
response.StatusCode.Should().Be(HttpStatusCode.OK);

// 區間檢查
((int)response.StatusCode).Should().BeInRange(200, 299);
```

### IsSuccessStatusCode

```csharp
// 內建 flag（200-299 為 true）
response.IsSuccessStatusCode.Should().BeTrue();
```

## 共用規則

1. **R1: 只驗證成功/失敗，不驗證內容** — 回傳內容的驗證屬於 readmodel-then
2. **R2: 使用 _ctx["LastResponse"] 已儲存的 response** — 不重新呼叫 API
3. **R3: 可跨 feature 共用** — 放在 `Steps/CommonThen/`，供所有 feature 重用
4. **R4: 錯誤訊息欄位多支援** — 兼容 `detail`（ProblemDetails）、`message`、`error`、`title`
5. **R5: 診斷訊息描述** — FluentAssertions 的 `.Should(..., "description", args)` 提供失敗時的上下文

## 完成條件

- `SuccessSteps` 和 `FailureSteps` 兩個類別已建立
- 支援「操作成功」「操作失敗」通用句型
- 支援特定狀態碼（401, 403, 404, 422 等）
- `ExtractErrorMessage` helper 涵蓋常見錯誤回應格式
- 位於 `Steps/CommonThen/`，供所有 feature 共用
