---
name: aibdd.auto.csharp.it.refactor
description: >
  C# IT Stage 4：重構階段。Phase A（測試程式碼）→ 跑測試 → Phase B（生產程式碼）→ 跑測試。
  嚴格遵守 /aibdd.auto.csharp.code-quality 規範。
---

# C# IT 重構階段

在綠燈保護下，以小步驟改善程式碼品質。每一步改動後都必須重跑測試，確保綠燈維持。

## 入口

### 被 control-flow 調用
接收目標 feature 路徑，確認綠燈後進入 Phase A → Phase B。

### 獨立使用
1. 詢問目標範圍（某個 feature 相關的程式碼）
2. 執行測試確認綠燈：`dotnet test --filter "Category!=Ignore"`
3. 進入 Phase A

## Workflow

```
Phase A: 重構測試程式碼（Steps/*.cs, Hooks, Helpers）
    ↓
跑測試 → dotnet test --filter "Category!=Ignore"
    ↓（保持綠燈）
Phase B: 重構生產程式碼（Models, Repositories, Services, Controllers, DTOs）
    ↓
跑測試 → dotnet test --filter "Category!=Ignore"
    ↓（保持綠燈）
完成
```

## 測試命令

```bash
# 重構後每次小改動必跑
dotnet test --filter "Category!=Ignore"

# 特定 feature
dotnet test --filter "FullyQualifiedName~LessonProgress"
```

## Formatter

```bash
# 自動格式化
dotnet format

# 嚴格模式（把 warning 當 error）
dotnet build -warnaserror
```

或使用 IDE 內建：Rider → Code → Reformat Code / VS → Format Document（Ctrl+K, D）。

---

## Phase A：測試程式碼重構

### 目標
Steps/*.cs、Hooks、Helpers 的可讀性與組織。

### 常見改善方向

1. **提取共用邏輯到 Helper**
   ```csharp
   // 重構前：每個 step 都寫一次
   var statusMap = new Dictionary<string, string> { ... };
   var mapped = statusMap.GetValueOrDefault(status, status);

   // 重構後：抽 StatusMapper.cs
   var mapped = StatusMapper.Map(status);
   ```

2. **移除 TODO 註解**（見 `/aibdd.auto.csharp.code-quality` §3）

3. **統一 ScenarioContext 存取模式**
   ```csharp
   // Steps/Helpers/ScenarioContextExtensions.cs
   public static class ScenarioContextExtensions
   {
       public static Dictionary<string, object> Ids(this ScenarioContext ctx)
           => ctx.Get<Dictionary<string, object>>("Ids");

       public static HttpClient Client(this ScenarioContext ctx)
           => ctx.Get<HttpClient>("HttpClient");

       public static AppDbContext Db(this ScenarioContext ctx)
           => ctx.Get<AppDbContext>("DbContext");
   }

   // 使用
   var userId = _ctx.Ids()[userName].ToString()!;
   var client = _ctx.Client();
   ```

4. **DataTable 解析抽取為 private method**

5. **Step pattern 的中文文字核對**（避免空格、標點差異）

### 完成條件
- 所有 TODO 已清除
- 重複邏輯已抽取
- 測試仍全綠

---

## Phase B：生產程式碼重構

### 目標
Controllers、Services、Repositories、Models 的品質。

### C# 特有重構模式

#### DTO → record

```csharp
// 重構前
public class UpdateVideoProgressRequest
{
    public int LessonId { get; set; }
    public int Progress { get; set; }
}

// 重構後
public record UpdateVideoProgressRequest(int LessonId, int Progress);
```

#### Status mapping → switch expression

```csharp
// 重構前
public string MapStatus(string status)
{
    if (status == "進行中") return "IN_PROGRESS";
    if (status == "已完成") return "COMPLETED";
    return status;
}

// 重構後
public static string MapStatus(string status) => status switch
{
    "進行中" => "IN_PROGRESS",
    "已完成" => "COMPLETED",
    "未開始" => "NOT_STARTED",
    _ => status
};
```

#### FirstOrDefault → null-coalescing throw

```csharp
// 重構前
var order = _context.Orders.First(o => o.Id == orderId); // 可能拋 InvalidOperationException

// 重構後
var order = _context.Orders.FirstOrDefault(o => o.Id == orderId)
    ?? throw new OrderNotFoundException(orderId);
```

#### Nullable reference types

```csharp
// 專案 csproj
<Nullable>enable</Nullable>

// 欄位明確標示
public string Name { get; set; } = null!;        // 非 null
public string? Description { get; set; }         // 可為 null
```

#### Constructor 精簡

```csharp
// 重構前
public class OrderService
{
    private readonly IOrderRepository _orderRepository;
    public OrderService(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }
}

// 重構後（C# 12 primary constructor）
public class OrderService(IOrderRepository orderRepository) : IOrderService
{
    private readonly IOrderRepository _orderRepository = orderRepository;
}
```

#### Pattern matching

```csharp
// 重構前
if (obj != null && obj is User)
{
    var user = (User)obj;
    // ...
}

// 重構後
if (obj is User user)
{
    // ...
}
```

#### Import ordering

```csharp
// 1. System.*
using System;
using System.Linq;

// 2. Microsoft.*
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// 3. Third-party
using FluentAssertions;

// 4. 本地
using ProjectName.Data;
using ProjectName.Models;
```

### 各層重構重點

#### Controller 層
- 提取共用的驗證邏輯（ASP.NET Core `[ApiController]` 自動處理 ModelState）
- 統一 API 回應格式（成功用 `Ok(...)`, 失敗用 `BadRequest(...)`）
- 錯誤回應使用 `ProblemDetails`

#### Service 層
- 提取業務規則為獨立方法
- 消除過長方法（單一職責）
- 引入 Strategy Pattern 處理條件分支
- 統一異常類型（自訂業務例外）

#### Repository 層
- 自訂查詢方法命名清晰（`FindByUserIdAndLessonId` vs `Get`）
- 使用 `AsNoTracking()` 做純查詢（效能）
- 考慮使用 `Include()` 預載關聯

#### Entity / DbContext 層
- `OnModelCreating` 配置集中於 `Configurations/` 子目錄
- 使用 `IEntityTypeConfiguration<T>` 拆分每個 Entity 的配置

```csharp
public class LessonProgressConfiguration : IEntityTypeConfiguration<LessonProgress>
{
    public void Configure(EntityTypeBuilder<LessonProgress> builder)
    {
        builder.ToTable("lesson_progresses");
        builder.HasKey(e => new { e.UserId, e.LessonId });
        builder.Property(e => e.Status).HasConversion<string>();
    }
}

// AppDbContext
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
```

---

## 安全規則

1. **每個小改動後都跑測試** — 失敗就立刻回滾
2. **一次只做一件事** — 不要同時改名 + 搬位置 + 重構邏輯
3. **絕不改變外部行為** — API 契約、DB schema、回傳格式都不能動
4. **程式碼已清晰時不強求重構** — 不為重構而重構
5. **避免自動抽取 helper**（除非明確要求）

## 重構粒度範例

每次只做一件：
- 提取一個方法
- 重命名一個變數 / 方法
- 消除一個重複片段
- 將 magic number 提取為 `const`
- 調整一個類別的職責
- 加入一個 `readonly` 修飾字

## 品質規範

完整 C# 品質規範見 `/aibdd.auto.csharp.code-quality`。

## 完成條件

- [ ] 所有測試通過（`dotnet test --filter "Category!=Ignore"`）
- [ ] 沒有 TODO / META 標記殘留
- [ ] 程式碼符合 `/aibdd.auto.csharp.code-quality` 檢查清單
- [ ] 沒有引入新功能或改變 API 契約
- [ ] `dotnet build -warnaserror` 無警告（可選）
