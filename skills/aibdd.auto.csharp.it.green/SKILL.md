---
name: aibdd.auto.csharp.it.green
description: >
  C# IT Stage 3：綠燈階段。Trial-and-error 循環讓測試通過，
  實作 EF Core Repository + Service 業務邏輯 + ASP.NET Core Controller + DI 註冊。
---

# C# IT 綠燈實作者

以 Red 階段產出的失敗測試為驅動，用最小增量迭代實作後端，直到所有測試通過。

## 入口

### 被 control-flow 調用
接收目標 feature 路徑。

### 獨立使用
1. 使用者指定要跑綠燈的 feature
2. 執行測試確認仍在紅燈
3. 進入迭代迴圈

## 測試命令

```bash
# 開發階段：特定 feature（快速迭代）
dotnet test --filter "FullyQualifiedName~LessonProgress"

# 開發階段：特定 scenario
dotnet test --filter "DisplayName~更新課程進度"

# 完成階段：所有非 @ignore 測試（總回歸）
dotnet test --filter "Category!=Ignore"
```

---

## 實作順序

從 Red 階段的缺口倒推：

1. **DTO (Record)** — Request / Response 資料容器
2. **Repository** — EF Core CRUD 真實實作
3. **Service** — 業務邏輯
4. **Controller** — API endpoint（ASP.NET Core）
5. **DI 註冊** — `Program.cs`

## 迭代迴圈

```
1. dotnet test → 看錯誤訊息
2. 分析失敗原因（404? 500? 400? Assertion?）
3. 寫最少程式碼修正這個錯誤
4. dotnet test → 再看
5. 新錯誤 → 回到 2
6. 特定測試通過 → 跑總回歸
```

### 最小增量範例

```csharp
// ❌ 做太多（測試沒要求）
[HttpPost("lesson-progress/update-video-progress")]
public IActionResult Update([FromBody] UpdateVideoProgressRequest request)
{
    ValidateInventory();         // 沒測試
    SendEmailNotification();     // 沒測試
    LogAuditTrail();             // 沒測試
    return _service.Update(request);
}

// ✅ 剛好夠
[HttpPost("lesson-progress/update-video-progress")]
public IActionResult Update([FromBody] UpdateVideoProgressRequest request)
{
    _service.UpdateProgress(request);
    return Ok();
}
```

---

## 框架 API

### Controller（ASP.NET Core）

```csharp
// src/${ProjectName}/Controllers/LessonProgressController.cs
using Microsoft.AspNetCore.Mvc;
using ProjectName.DTOs;
using ProjectName.Services;

namespace ProjectName.Controllers;

[ApiController]
[Route("api/v1")]
public class LessonProgressController : ControllerBase
{
    private readonly ILessonProgressService _service;

    public LessonProgressController(ILessonProgressService service) => _service = service;

    [HttpPost("lesson-progress/update-video-progress")]
    public IActionResult UpdateVideoProgress([FromBody] UpdateVideoProgressRequest request)
    {
        var userId = HttpContext.Items["UserId"]?.ToString()
            ?? throw new UnauthorizedAccessException();
        _service.UpdateVideoProgress(userId, request.LessonId, request.Progress);
        return Ok();
    }

    [HttpGet("lessons/{lessonId:int}/progress")]
    public IActionResult GetProgress(int lessonId)
    {
        var userId = HttpContext.Items["UserId"]?.ToString()
            ?? throw new UnauthorizedAccessException();
        var progress = _service.GetProgress(userId, lessonId);
        return Ok(progress);
    }
}
```

### Service

```csharp
public class LessonProgressService : ILessonProgressService
{
    private readonly ILessonProgressRepository _repo;

    public LessonProgressService(ILessonProgressRepository repo) => _repo = repo;

    public void UpdateVideoProgress(string userId, int lessonId, int progress)
    {
        var entity = _repo.FindByUserIdAndLessonId(userId, lessonId)
            ?? new LessonProgress { UserId = userId, LessonId = lessonId };

        // 業務規則：進度不可倒退
        if (progress < entity.Progress)
            throw new InvalidProgressException("進度不可倒退");

        entity.Progress = progress;
        entity.Status = progress == 100 ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS;
        entity.UpdatedAt = DateTime.UtcNow;

        _repo.Save(entity);
    }

    public LessonProgressResponse GetProgress(string userId, int lessonId)
    {
        var entity = _repo.FindByUserIdAndLessonId(userId, lessonId)
            ?? throw new NotFoundException($"找不到 user={userId} lesson={lessonId} 的進度");
        return new LessonProgressResponse(entity.LessonId, entity.Progress, entity.Status.ToString());
    }
}
```

### Repository（EF Core 實作）

```csharp
public class LessonProgressRepository : ILessonProgressRepository
{
    private readonly AppDbContext _context;

    public LessonProgressRepository(AppDbContext context) => _context = context;

    public LessonProgress? FindByUserIdAndLessonId(string userId, int lessonId)
        => _context.LessonProgresses
            .FirstOrDefault(e => e.UserId == userId && e.LessonId == lessonId);

    public void Save(LessonProgress entity)
    {
        var existing = _context.LessonProgresses
            .FirstOrDefault(e => e.UserId == entity.UserId && e.LessonId == entity.LessonId);

        if (existing == null)
        {
            _context.LessonProgresses.Add(entity);
        }
        else
        {
            _context.Entry(existing).CurrentValues.SetValues(entity);
        }
        _context.SaveChanges();
    }
}
```

### DI 註冊（Program.cs）

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ILessonProgressRepository, LessonProgressRepository>();
builder.Services.AddScoped<ILessonProgressService, LessonProgressService>();

builder.Services.AddControllers();

var app = builder.Build();
app.UseMiddleware<JwtMiddleware>();
app.MapControllers();
app.Run();

public partial class Program { }
```

---

## 常見錯誤修復表

| 失敗 | 原因 | 修復 |
|------|------|------|
| HTTP 404 | API endpoint 未註冊 | 建 Controller + `[HttpPost/Get]` + `[Route]` |
| HTTP 500 | 內部異常 | 看 log / stack trace，修 Service / Repository |
| HTTP 400 | 驗證失敗 | 修業務規則 |
| HTTP 401 | JWT 驗證失敗 | 確認 `JwtMiddleware` 已註冊；`SecretKey` 與 `JwtHelper` 一致 |
| `InvalidOperationException: No service for type 'IXxx' has been registered` | DI 未註冊 | `builder.Services.AddScoped<IXxx, Xxx>()` |
| `NotImplementedException` | Repository / Service 方法未實作 | 填入實作 |
| `DbUpdateException: duplicate key value` | 複合 Key 重複 | `Repository.Save` 改用 upsert 邏輯 |
| Testcontainers 啟動失敗 | Docker Desktop 未啟動 | `docker info` 確認，重啟 Docker |
| Assertion 失敗 `expected X but was Y` | Service 邏輯錯誤 | 調整業務規則 |

### 錯誤診斷步驟

```
錯誤 → HTTP 500
  └→ 看 stack trace
       ├→ NotImplementedException → 填方法實作
       ├→ DbUpdateException → 修 DB 操作邏輯
       ├→ NullReferenceException → 加 null check 或修初始化
       └→ 業務規則異常 → 檢視是否符合 feature 要求
```

---

## Docker / 環境

### 執行前確認

```bash
docker ps          # Docker daemon 是否運行
docker info        # 完整資訊
docker pull postgres:16-alpine   # 預載 image（首次）
```

### 常見環境錯誤

| 錯誤 | 原因 | 解法 |
|------|------|------|
| `Could not find a valid Docker environment` | Docker Desktop 未啟動 | 啟動 Docker Desktop |
| `Port 5432 already in use` | 本地 PostgreSQL 佔用 | 停止本地 DB，或讓 Testcontainers 用隨機 port（預設行為） |
| `Connection refused` 在測試中途 | 容器過早終止 | 檢查 `CustomWebApplicationFactory.DisposeAsync()` 順序 |

---

## 迭代策略

### 開發循環（快速迭代）

```
1. dotnet test --filter "FullyQualifiedName~FeatureName"
2. 看錯誤 → 理解失敗原因
3. 寫最少程式碼修正
4. 再次執行特定測試
5. 仍失敗 → 回到 2
6. 通過 → 進入完成驗證
```

### 完成驗證（回歸測試）

```
7. dotnet test --filter "Category!=Ignore"
8. 全綠 → 完成綠燈
9. 有失敗 → 回到 2，修復被打破的測試
```

### 完成判定標準

```
特定測試通過 → 功能開發完成
                ↓
         執行總回歸測試
                ↓
  dotnet test --filter "Category!=Ignore"
                ↓
         所有測試通過
                ↓
           綠燈達成
```

---

## 完成條件

- [ ] 特定 feature 測試通過：`dotnet test --filter "FullyQualifiedName~FeatureName"`
- [ ] 總回歸測試通過：`dotnet test --filter "Category!=Ignore"`
- [ ] 沒有破壞既有功能
- [ ] 程式碼簡單直接
- [ ] 未引入任何測試未要求的功能
- [ ] 沒有殘留 `throw new NotImplementedException()`
