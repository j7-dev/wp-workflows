---
name: aibdd.auto.csharp.it.red
description: >
  C# IT 紅燈實作執行器。對單一 .feature 執行完整紅燈流程：
  Schema Analysis → Step Template → Red Implementation（載入 Handler 實作測試）。
  當 /aibdd.auto.csharp.it.control-flow 呼叫紅燈階段，或使用者說「紅燈」「red」時觸發。
---

# C# IT 紅燈實作執行器

寫出測試程式，確認有 Failing Test（Value Difference，非環境問題）。

## 紅燈定義

- **(a) 環境正常** — Docker 可用、Testcontainers PostgreSQL 可啟動、`dotnet build` 通過
- **(b) Value Difference** — 測試預期某個值，但系統回傳不對（API 未實作 → HTTP 404）

環境問題 ≠ 紅燈。Value Difference = 紅燈。兩者都符合才算正式進入 Red。

## 預期紅燈失敗模式

| 失敗類型 | 意義 | 是否紅燈 |
|---------|------|---------|
| HTTP 404 Not Found | API endpoint 尚未註冊 | ✅ 紅燈（Value Difference） |
| HTTP 500 Internal | Service/Controller 拋異常 | ✅ 紅燈（未實作） |
| Assertion 失敗 | 回傳值不符預期 | ✅ 紅燈 |
| `NotImplementedException` | Repository/Service 方法未實作 | ✅ 紅燈 |
| 編譯錯誤 | 缺 class / using | ❌ 環境問題（需先修） |
| Testcontainers 啟動失敗 | Docker 未啟動 | ❌ 環境問題 |

---

## 三步驟流程

```
Step 1: Schema Analysis → 引用 /aibdd.auto.csharp.it.schema-analysis
        確保 EF Core Entity / DbContext / Migration 與 spec 對齊

Step 2: Step Template   → 引用 /aibdd.auto.csharp.it.step-template
        為 feature 產出 SpecFlow step class 骨架（含 TODO + PendingStepException）

Step 3: Red Implementation → 對每個 TODO step：
        - 讀 TODO 取得 handler type
        - 引用對應 /aibdd.auto.csharp.it.handlers.{type}
        - 將 PendingStepException 替換為完整測試程式碼
        - 同時建立基礎設施（Models / Repositories / Services 介面）
        - 執行 dotnet test 驗證紅燈（預期 HTTP 404）
```

### Step 1: Schema Analysis

引用 `/aibdd.auto.csharp.it.schema-analysis`。

核心任務：
1. 讀取 .feature + api.yml + erm.dbml
2. 比對現有 EF Core Entity / DbContext / Migrations 是否一致
3. 產出 GO/NO-GO 決策
4. 若需要：建立 Entity、註冊 DbSet、新增 Migration

### Step 2: Step Template Generation

引用 `/aibdd.auto.csharp.it.step-template`。

核心任務：
1. 解析 Feature 的 Given/When/Then steps
2. 用決策樹分類每個 step（handler type）
3. 產出 SpecFlow step class 骨架：
   - `[Binding]` class
   - Constructor injection of `ScenarioContext`
   - 每個 step 用 regex attribute + `throw new PendingStepException()`
   - TODO 標註指向對應 handler skill

### Step 3: Red Implementation

對每個含 TODO 的 step definition：

1. 讀 TODO 取得 handler type
2. 引用對應 handler skill（例如 `/aibdd.auto.csharp.it.handlers.command`）
3. 將 `PendingStepException` 替換為完整測試代碼
4. 需要時注入額外依賴（`HttpClient`, `AppDbContext`, `JwtHelper`）

同時建立基礎設施（若不存在）：

#### EF Core Entity 類別
放在 `src/${ProjectName}/Models/`。由 schema-analysis 建立，紅燈階段補強屬性。

#### Repository Interface + 空實作
```csharp
// src/${ProjectName}/Repositories/ILessonProgressRepository.cs
public interface ILessonProgressRepository
{
    LessonProgress? FindByUserIdAndLessonId(string userId, int lessonId);
    void Save(LessonProgress entity);
}

// src/${ProjectName}/Repositories/LessonProgressRepository.cs
public class LessonProgressRepository : ILessonProgressRepository
{
    private readonly AppDbContext _context;
    public LessonProgressRepository(AppDbContext context) => _context = context;

    public LessonProgress? FindByUserIdAndLessonId(string userId, int lessonId)
        => throw new NotImplementedException();

    public void Save(LessonProgress entity)
        => throw new NotImplementedException();
}
```

#### Service Interface + 空實作
```csharp
// src/${ProjectName}/Services/ILessonProgressService.cs
public interface ILessonProgressService
{
    void UpdateVideoProgress(string userId, int lessonId, int progress);
}

// src/${ProjectName}/Services/LessonProgressService.cs
public class LessonProgressService : ILessonProgressService
{
    public void UpdateVideoProgress(string userId, int lessonId, int progress)
        => throw new NotImplementedException();
}
```

#### DTO（Request/Response Records）
```csharp
// src/${ProjectName}/DTOs/UpdateVideoProgressRequest.cs
public record UpdateVideoProgressRequest(int LessonId, int Progress);
```

#### DI 註冊（保留空殼，但未註冊路由）
```csharp
// Program.cs
builder.Services.AddScoped<ILessonProgressRepository, LessonProgressRepository>();
builder.Services.AddScoped<ILessonProgressService, LessonProgressService>();
```

**不要建立 Controller** — 這樣測試才會收到 HTTP 404（紅燈）。

---

## 共用規則（跨 handler、跨 step）

### R1: Command 不驗 Response 內容
Command handler 只儲存 `HttpResponseMessage` 到 `_ctx["LastResponse"]`，不做 assertion。

### R2: 欄位名必須與 api.yml 一致
Request/Response 欄位名以 `api.yml` schemas 為 SSOT。C# 預設 camelCase（`lessonId`, `newLeadsThisMonth`）。

### R3: ID 儲存到共享狀態
建立實體後，將 ID 存入 `_ctx.Get<Dictionary<string, object>>("Ids")[naturalKey] = id`。

### R4: Models/Repositories/Services 置於 src/ 目錄
基礎設施放在 production code 目錄，非 tests/ 目錄。

### R5: 不實作後端業務邏輯
Red 階段只建立 interface + 空實作。
- Service/Repository 方法 `throw new NotImplementedException()`
- **不建立 Controller**（缺 Controller 造成 HTTP 404，符合紅燈預期）

### R6: 測試預期失敗（紅燈）
失敗原因必須是 Value Difference（HTTP 404）而非環境問題。

### R7: 使用真實資料庫（Integration Test）
Testcontainers PostgreSQL，不使用 In-Memory Provider（EF Core `UseInMemoryDatabase` 不支援複合 Key 的某些行為，不夠真實）。

### R8: Data Table 逐欄對應
Feature 的 Data Table 欄位與 api.yml / erm.dbml 欄位 1:1 對應。

### R9: API Endpoint Path = api.yml 定義
HTTP 路徑從 `api.yml` paths 讀取，不自行編造。

---

## Docker 環境檢查（Red 執行前）

```bash
docker info   # Daemon 運行中
docker ps     # 無殘留 Testcontainers
```

若 Docker 未啟動，先提示使用者啟動 Docker Desktop。

---

## 測試命令

```bash
# 特定 feature（快速迭代）
dotnet test --filter "FullyQualifiedName~LessonProgress"

# 所有非 @ignore 的測試
dotnet test --filter "Category!=Ignore"
```

## 完成條件

- [ ] `dotnet build` 通過（環境 OK）
- [ ] Docker / Testcontainers 可啟動（環境 OK）
- [ ] 所有 step definition 已從 `PendingStepException` 替換為完整測試代碼
- [ ] EF Core Entity / DbContext / Migration 完整
- [ ] Repository interface + 空實作已建立（`NotImplementedException`）
- [ ] Service interface + 空實作已建立（`NotImplementedException`）
- [ ] DI 已註冊
- [ ] **Controller 尚未建立**（確保 HTTP 404 紅燈）
- [ ] 測試執行 → HTTP 404 失敗（Value Difference）
- [ ] 欄位名與 api.yml 一致
