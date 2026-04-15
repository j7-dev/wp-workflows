using FluentAssertions;
using TechTalk.SpecFlow;

namespace ${ProjectName}.IntegrationTests.Steps.CommonThen;

[Binding]
public class SuccessSteps
{
    private readonly ScenarioContext _ctx;

    public SuccessSteps(ScenarioContext ctx) => _ctx = ctx;

    [Then(@"操作成功")]
    public void ThenOperationSucceeds()
    {
        var response = _ctx.Get<HttpResponseMessage>("LastResponse");
        ((int)response.StatusCode).Should().BeInRange(200, 299,
            "預期成功（2xx），實際 {0}", (int)response.StatusCode);
    }
}
