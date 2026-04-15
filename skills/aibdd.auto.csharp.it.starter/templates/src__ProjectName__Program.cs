using Microsoft.EntityFrameworkCore;
using ${ProjectName}.Data;
using ${ProjectName}.Helpers;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=${ProjectName}_dev;Username=postgres;Password=postgres"));

// Controllers
builder.Services.AddControllers();

// DI registrations (green 階段會在此新增)
// builder.Services.AddScoped<IXxxRepository, XxxRepository>();
// builder.Services.AddScoped<IXxxService, XxxService>();

var app = builder.Build();

// JWT middleware（讀取 Authorization header 並掛 UserId 到 HttpContext.Items）
app.UseMiddleware<JwtMiddleware>();

app.MapControllers();

app.Run();

// 讓 WebApplicationFactory<Program> 能存取
public partial class Program { }
