using System.Text.Json;
using FluentAssertions;
using TechTalk.SpecFlow;

namespace ${ProjectName}.IntegrationTests.Steps.CommonThen;

[Binding]
public class FailureSteps
{
    private readonly ScenarioContext _ctx;

    public FailureSteps(ScenarioContext ctx) => _ctx = ctx;

    [Then(@"操作失敗")]
    public void ThenOperationFails()
    {
        var response = _ctx.Get<HttpResponseMessage>("LastResponse");
        ((int)response.StatusCode).Should().BeInRange(400, 499,
            "預期失敗（4xx），實際 {0}", (int)response.StatusCode);
    }

    [Then(@"錯誤訊息應包含 ""(.*)""")]
    public async Task ThenErrorMessageContains(string expectedMessage)
    {
        var response = _ctx.Get<HttpResponseMessage>("LastResponse");
        var body = await response.Content.ReadAsStringAsync();
        var message = ExtractErrorMessage(body);

        message.Should().Contain(expectedMessage,
            "預期錯誤訊息含 '{0}'，實際: {1}", expectedMessage, message);
    }

    [Then(@"HTTP 狀態碼應為 (.*)")]
    public void ThenStatusCodeShouldBe(int expectedCode)
    {
        var response = _ctx.Get<HttpResponseMessage>("LastResponse");
        ((int)response.StatusCode).Should().Be(expectedCode);
    }

    private static string ExtractErrorMessage(string body)
    {
        try
        {
            var data = JsonSerializer.Deserialize<JsonElement>(body);
            if (data.TryGetProperty("detail", out var detail)) return detail.GetString() ?? body;
            if (data.TryGetProperty("message", out var msg)) return msg.GetString() ?? body;
            if (data.TryGetProperty("error", out var error))
                return error.ValueKind == JsonValueKind.String ? error.GetString() ?? body : error.ToString();
            if (data.TryGetProperty("title", out var title)) return title.GetString() ?? body;
            return body;
        }
        catch (JsonException)
        {
            return body;
        }
    }
}
