using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TechTalk.SpecFlow;
using ${ProjectName}.Data;
using ${ProjectName}.IntegrationTests.Helpers;

namespace ${ProjectName}.IntegrationTests.Hooks;

[Binding]
public class TestHooks
{
    private static CustomWebApplicationFactory _factory = null!;
    private readonly ScenarioContext _ctx;

    public TestHooks(ScenarioContext ctx) => _ctx = ctx;

    [BeforeTestRun]
    public static async Task BeforeTestRun()
    {
        _factory = new CustomWebApplicationFactory();
        await _factory.InitializeAsync();
    }

    [BeforeScenario]
    public void BeforeScenario()
    {
        var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 每個 scenario 一個乾淨的 DB
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();

        _ctx["HttpClient"] = _factory.CreateClient();
        _ctx["DbContext"] = dbContext;
        _ctx["Ids"] = new Dictionary<string, object>();
        _ctx["JwtHelper"] = new JwtHelper();
        _ctx["ServiceScope"] = scope;
    }

    [AfterScenario]
    public void AfterScenario()
    {
        if (_ctx.TryGetValue("ServiceScope", out var scopeObj) && scopeObj is IServiceScope scope)
            scope.Dispose();

        if (_ctx.TryGetValue("HttpClient", out var clientObj) && clientObj is HttpClient client)
            client.Dispose();
    }

    [AfterTestRun]
    public static async Task AfterTestRun()
    {
        await _factory.DisposeAsync();
    }
}
