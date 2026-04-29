---
name: aibdd.auto.csharp.it.starter
description: >
  C# IT 專案骨架生成器。使用 AskUserQuestion 詢問專案目錄與命名，
  再從 templates/ 一次性建立完整的 ASP.NET Core + SpecFlow + Testcontainers 骨架。
---

# C# IT 專案骨架生成器

一次性建立 C# Integration Test 專案骨架：ASP.NET Core Web API + SpecFlow + Testcontainers PostgreSQL + xUnit + FluentAssertions。

## 角色

C# IT project scaffold generator。讀取 `templates/` 內所有檔案，替換 `${ProjectName}` 佔位符，輸出到目標目錄。

## 互動流程

1. 使用 `AskUserQuestion` 詢問：
   - **專案目錄**（絕對路徑，將作為 solution 根目錄）
   - **專案名稱**（PascalCase，如 `WsaPlatform`）
2. 驗證目錄存在（或協助建立）
3. 讀取 `templates/` 每個檔案
4. 替換 `${ProjectName}` 為使用者輸入
5. 將檔名的 `__` 還原為路徑分隔符（例如 `src__ProjectName__Program.cs` → `src/WsaPlatform/Program.cs`）
6. 寫入目標位置
7. 執行驗證命令

---

## 產出目錄結構

```
${PROJECT_DIR}/
├── src/
│   └── ${ProjectName}/
│       ├── Program.cs
│       ├── ${ProjectName}.csproj
│       ├── Models/              # 空目錄（schema-analysis 填入）
│       ├── Repositories/        # 空目錄（red 填入）
│       ├── Services/            # 空目錄（red 填入）
│       ├── Controllers/         # 空目錄（green 填入）
│       ├── DTOs/                # 空目錄
│       ├── Data/
│       │   └── AppDbContext.cs
│       └── Helpers/
│           └── JwtMiddleware.cs
├── tests/
│   └── ${ProjectName}.IntegrationTests/
│       ├── ${ProjectName}.IntegrationTests.csproj
│       ├── specflow.json
│       ├── CustomWebApplicationFactory.cs
│       ├── Hooks/
│       │   └── TestHooks.cs
│       ├── Helpers/
│       │   └── JwtHelper.cs
│       ├── Steps/
│       │   └── CommonThen/
│       │       ├── SuccessSteps.cs
│       │       └── FailureSteps.cs
│       └── Features/            # symlink 至 specs/features/
├── ${ProjectName}.sln
├── docker-compose.yml
└── .gitignore
```

---

## 驗證命令

```bash
# 還原 NuGet 套件
dotnet restore

# 編譯確認沒錯
dotnet build

# 嘗試跑一次 test（此時沒有 feature，應該 0 tests 通過即可）
dotnet test

# 驗證 Docker 可用
docker compose up -d
docker compose ps
docker compose down
```

## 範本檔案清單（templates/）

| 檔名 | 產出位置 |
|------|----------|
| `src__ProjectName__Program.cs` | `src/${ProjectName}/Program.cs` |
| `src__ProjectName__Data__AppDbContext.cs` | `src/${ProjectName}/Data/AppDbContext.cs` |
| `src__ProjectName__Helpers__JwtMiddleware.cs` | `src/${ProjectName}/Helpers/JwtMiddleware.cs` |
| `src__ProjectName__ProjectName.csproj` | `src/${ProjectName}/${ProjectName}.csproj` |
| `tests__IT__CustomWebApplicationFactory.cs` | `tests/${ProjectName}.IntegrationTests/CustomWebApplicationFactory.cs` |
| `tests__IT__Hooks__TestHooks.cs` | `tests/${ProjectName}.IntegrationTests/Hooks/TestHooks.cs` |
| `tests__IT__Helpers__JwtHelper.cs` | `tests/${ProjectName}.IntegrationTests/Helpers/JwtHelper.cs` |
| `tests__IT__Steps__CommonThen__SuccessSteps.cs` | `tests/${ProjectName}.IntegrationTests/Steps/CommonThen/SuccessSteps.cs` |
| `tests__IT__Steps__CommonThen__FailureSteps.cs` | `tests/${ProjectName}.IntegrationTests/Steps/CommonThen/FailureSteps.cs` |
| `tests__IT__specflow.json` | `tests/${ProjectName}.IntegrationTests/specflow.json` |
| `tests__IT__ProjectName.IntegrationTests.csproj` | `tests/${ProjectName}.IntegrationTests/${ProjectName}.IntegrationTests.csproj` |
| `ProjectName.sln` | `${ProjectName}.sln` |
| `docker-compose.yml` | `docker-compose.yml` |

`IT` 代表 `${ProjectName}.IntegrationTests`，寫檔時替換為實際名稱。

---

## 關鍵規則

1. **R1: 替換所有 `${ProjectName}` 佔位符** — 包含檔名、class name、namespace、.sln project path
2. **R2: 建立空目錄** — `Models/`, `Repositories/`, `Services/`, `Controllers/`, `DTOs/`（可放 `.gitkeep`）
3. **R3: Features/ 使用 symlink** — 指向 `specs/features/`，保持 SSOT 一致
4. **R4: 驗證 `dotnet build` 成功後才算完成**
5. **R5: 使用 Controller-based API**（不用 Minimal API） — 方便 `[ApiController]` + 屬性路由
6. **R6: `Program.cs` 結尾加 `public partial class Program { }`** — 讓 `WebApplicationFactory<Program>` 能存取

---

## 與其他 skill 的關係

```
使用者呼叫 /zenbu-powers:aibdd.auto.csharp.it.starter
    ↓
產出完整骨架（專案結構 + 框架配置）
    ↓
後續由 /zenbu-powers:aibdd.auto.csharp.it.control-flow 驅動：
    → schema-analysis 填入 Models/
    → step-template 填入 Steps/
    → red 填入 Repositories/ Services/（空實作）
    → green 填入 Controllers/ + 方法實作
    → refactor 改善品質
```

## 完成條件

- [ ] 所有 13 個範本檔案已寫入正確位置
- [ ] `${ProjectName}` 佔位符全部替換
- [ ] `dotnet restore` 成功
- [ ] `dotnet build` 成功
- [ ] `docker compose up -d` 可啟動 PostgreSQL
- [ ] Solution 結構符合標準（`src/` 與 `tests/` 分離）
