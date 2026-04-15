---
name: aibdd.auto.csharp.code-quality
description: >
  C# Integration Test 程式碼品質規範合集。包含 SOLID 設計原則、Step Definition 組織規範、
  Meta 註記清理、日誌實踐、程式架構、程式碼品質等規範。供 refactor 階段嚴格遵守。
---

# C# 程式碼品質規範

供 `/aibdd.auto.csharp.it.refactor` 重構階段嚴格遵守。涵蓋 SOLID、Step Definition 組織、Meta 清理、日誌實踐、程式架構、程式碼品質。

---

## 1. SOLID 設計原則

### S — 單一職責（SRP）

每個類別/方法只負責一件事。

```csharp
// ❌ Service 做太多事
public class AssignmentService
{
    public void SubmitAssignment(string userId, string content)
    {
        CheckPermission(userId);
        _repository.Save(new Assignment(userId, content));
        SendEmail(userId);
    }
}

// ✅ 職責分離（constructor DI）
public class AssignmentService
{
    private readonly IAssignmentRepository _repository;
    private readonly IPermissionValidator _validator;
    private readonly INotificationService _notifier;

    public AssignmentService(
        IAssignmentRepository repository,
        IPermissionValidator validator,
        INotificationService notifier)
    {
        _repository = repository;
        _validator = validator;
        _notifier = notifier;
    }

    public void SubmitAssignment(string userId, string content)
    {
        _validator.Validate(userId);
        _repository.Save(new Assignment(userId, content));
        _notifier.Notify(userId);
    }
}
```

### O — 開放封閉（OCP）

透過 interface + DI 擴展。

```csharp
public interface IPaymentStrategy
{
    void Pay(Order order);
}

public class CreditCardPayment : IPaymentStrategy { /* ... */ }
public class LinePayPayment : IPaymentStrategy { /* ... */ }

// Program.cs
builder.Services.AddScoped<IPaymentStrategy, CreditCardPayment>();
```

### L — 里氏替換（LSP）

子類別可安全替換父類別，不改變契約。

### I — 介面隔離（ISP）

```csharp
// ❌ 過大介面
public interface IUserService
{
    void CreateUser(); void UpdateUser(); void SendEmail(); void GenerateReport();
}

// ✅ 分離
public interface IUserCrudService { void CreateUser(); void UpdateUser(); }
public interface IEmailService { void SendEmail(); }
public interface IReportService { void GenerateReport(); }
```

### D — 依賴反轉（DIP）

Constructor injection，依賴抽象（interface），不依賴具體實作。

```csharp
public class OrderService
{
    private readonly IOrderRepository _orders;
    private readonly IProductRepository _products;

    public OrderService(IOrderRepository orders, IProductRepository products)
    {
        _orders = orders;
        _products = products;
    }
}

// Program.cs
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<OrderService>();
```

---

## 2. Step Definition 組織規範

### 組織原則

- 一個 step class = 一個 subdomain + handler type 組合
- 使用 `[Binding]` 標記
- Constructor injection of `ScenarioContext`

### 目錄結構

```
tests/${ProjectName}.IntegrationTests/Steps/
├── Lesson/                          # {Subdomain}
│   ├── AggregateGiven/
│   │   └── LessonProgressGivenSteps.cs
│   ├── Commands/
│   │   └── UpdateVideoProgressSteps.cs
│   ├── Query/
│   │   └── GetLessonProgressSteps.cs
│   ├── AggregateThen/
│   │   └── LessonProgressThenSteps.cs
│   └── ReadModelThen/
│       └── ProgressResultSteps.cs
├── Order/                           # 另一個 subdomain
│   └── ...
├── CommonThen/                      # 跨 feature 共用
│   ├── SuccessSteps.cs
│   └── FailureSteps.cs
└── Helpers/
    ├── StatusMapper.cs
    └── ScenarioContextExtensions.cs
```

### 共用 Helper 範例

```csharp
public static class StatusMapper
{
    private static readonly Dictionary<string, string> Mapping = new()
    {
        ["進行中"] = "IN_PROGRESS",
        ["已完成"] = "COMPLETED",
        ["未開始"] = "NOT_STARTED",
        ["已付款"] = "PAID",
        ["待付款"] = "PENDING"
    };

    public static string Map(string chineseStatus) =>
        Mapping.GetValueOrDefault(chineseStatus, chineseStatus);
}
```

---

## 3. Meta 註記清理

### 刪除

- `// TODO: [事件風暴部位: ...]`
- `// TODO: 參考 /aibdd.auto.csharp.it.handlers.xxx 實作`
- `/// <summary> TODO: ... </summary>`

### 保留

- 業務邏輯的 XML doc 註解
- 複雜演算法的說明註解

### 範例

```csharp
// 重構前
[Given(@"...")]
public void GivenUserHasProgress(...)
{
    // TODO: [事件風暴部位: Aggregate - LessonProgress]
    // TODO: 參考 /aibdd.auto.csharp.it.handlers.aggregate-given 實作
    var userId = Ids[userName].ToString()!;
    // ...
}

// 重構後（移除 TODO，保留業務註解）
[Given(@"...")]
public void GivenUserHasProgress(...)
{
    var userId = Ids[userName].ToString()!;
    var mappedStatus = StatusMapper.Map(status); // 中文狀態 → enum
    // ...
}
```

---

## 4. 日誌實踐

### 框架

使用 `ILogger<T>`（Microsoft.Extensions.Logging）+ structured logging。

```csharp
// ❌ Console.WriteLine
public class OrderService
{
    public void CreateOrder() => Console.WriteLine("Order created");
}

// ✅ ILogger<T> + structured logging
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger) => _logger = logger;

    public void CreateOrder(string orderNumber, string userId)
    {
        _logger.LogInformation(
            "Order created: OrderNumber={OrderNumber}, UserId={UserId}",
            orderNumber, userId);
    }
}
```

### 等級規則

| 等級 | 用途 | 範例 |
|------|------|------|
| Error | 未預期異常，含 stack trace | `_logger.LogError(ex, "Unexpected: {Message}", ex.Message)` |
| Warning | 認證失敗、權限不足 | `_logger.LogWarning("Expired JWT for {Method} {Uri}", method, uri)` |
| Information | 業務關鍵操作完成 | `_logger.LogInformation("Order created: OrderNumber={N}", orderNumber)` |
| Debug | 詳細流程、查詢數量 | `_logger.LogDebug("Fetching order={Id}", orderId)` |

### 各層策略

- **Controller**：`LogInformation` 記錄請求進入
- **Service**：`LogInformation` 寫入完成；`LogDebug` 查詢結果
- **Middleware**：`LogWarning` 認證失敗
- **Global Exception Handler**：`LogError`

### 禁止

- ❌ `Console.WriteLine` / `Console.Error`
- ❌ 字串拼接（`$"msg {var}"` 作為 log message）
- ❌ 在迴圈中大量 log
- ❌ 記錄敏感資訊（password, token, credit card）

### 結構化格式範例

```csharp
// ❌ 字串拼接（無法結構化查詢）
_logger.LogInformation($"Order {orderNumber} created by {userId}");

// ✅ 結構化佔位符
_logger.LogInformation(
    "Order created: OrderNumber={OrderNumber}, UserId={UserId}",
    orderNumber, userId);
```

---

## 5. 程式架構規範

### 分層

```
src/${ProjectName}/
├── Controllers/      # [ApiController] + [Route] + [HttpPost/Get/Put/Delete]
├── Services/         # 業務邏輯，constructor DI
├── Repositories/     # (可選) 資料存取抽象；或直接使用 DbContext
├── Models/           # EF Core entities
├── DTOs/             # Request/Response records
├── Data/             # AppDbContext
├── Helpers/          # Middleware, utilities
└── Program.cs        # DI 註冊 + middleware pipeline
```

### 各層職責

| 層 | 負責 | 不負責 |
|----|------|--------|
| Controller | 路由、解析 Request、構建 Response | 業務邏輯、資料存取 |
| Service | 業務規則、協調 Repository、拋業務異常 | HTTP 處理、直接操作 SQL |
| Repository | LINQ/EF Core CRUD、自訂查詢 | 業務規則 |
| Model | EF Core Entity 定義 | 驗證、業務邏輯 |
| DTO | Request/Response 資料容器（`record`） | 行為、方法 |

### DI 註冊慣例

```csharp
// Program.cs
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(/* ... */);
```

### 常見錯誤

- ❌ 業務邏輯寫在 Controller
- ❌ Service 直接用 `DbContext`（繞過 Repository 抽象；除非整個專案選擇「不使用 Repository 模式」的一致作法）
- ❌ 透過 static 方法取得 DB 連線（無法測試）

---

## 6. 程式碼品質

### readonly 欄位

所有透過 constructor DI 注入的欄位宣告為 `readonly`。

```csharp
// ✅
private readonly IOrderRepository _repository;
private readonly ILogger<OrderService> _logger;
```

### record 作為 DTO

不可變 DTO 使用 `record`：

```csharp
public record UpdateVideoProgressRequest(int LessonId, int Progress);
public record LessonProgressResponse(int LessonId, int Progress, string Status);
```

### switch 表達式

```csharp
// ❌ if-else
public string MapStatus(string status)
{
    if (status == "進行中") return "IN_PROGRESS";
    else if (status == "已完成") return "COMPLETED";
    else return status;
}

// ✅ switch expression
public string MapStatus(string status) => status switch
{
    "進行中" => "IN_PROGRESS",
    "已完成" => "COMPLETED",
    "未開始" => "NOT_STARTED",
    _ => status
};
```

### Nullable Reference Types

專案必須開啟 `<Nullable>enable</Nullable>`。

```csharp
// 明確標示可為 null
public string? Description { get; set; }

// Null-conditional + null-coalescing
var name = user?.Name ?? "匿名";
```

### Early Return / Guard Clauses

```csharp
// ❌ 深層巢狀
public void Process(Data? data)
{
    if (data != null)
    {
        if (data.IsValid)
        {
            DoWork(data);
        }
    }
}

// ✅ Guard clauses
public void Process(Data? data)
{
    if (data is null) throw new ArgumentNullException(nameof(data));
    if (!data.IsValid) throw new ValidationException("Invalid data");
    DoWork(data);
}
```

### 靜態常數

```csharp
// ❌ 每次方法呼叫都建立
public string Map(string status)
{
    var mapping = new Dictionary<string, string> { ["A"] = "狀態A" };
    return mapping[status];
}

// ✅ static readonly
private static readonly Dictionary<string, string> StatusMapping = new()
{
    ["A"] = "狀態A"
};
```

### FirstOrDefault + null 處理

```csharp
// ❌ 直接取值（可能 NullReferenceException）
var order = _context.Orders.First(o => o.Id == orderId);

// ✅ FirstOrDefault + 明確拋出
var order = _context.Orders.FirstOrDefault(o => o.Id == orderId)
    ?? throw new OrderNotFoundException(orderId);
```

### async/await 一致性

```csharp
// ✅ 全程 async
public async Task<Order> GetOrderAsync(int id)
{
    return await _context.Orders.FirstOrDefaultAsync(o => o.Id == id)
        ?? throw new OrderNotFoundException(id);
}
```

### nameof() 取代硬編碼字串

```csharp
// ❌
throw new ArgumentNullException("userId");

// ✅
throw new ArgumentNullException(nameof(userId));
```

### 命名

- 方法名：PascalCase，動詞開頭（`UpdateVideoProgress`）
- 欄位：`_camelCase`（private readonly）
- 屬性：PascalCase
- 常數：PascalCase（`MaxRetryCount`）
- 布林：`is`/`has`/`can` 開頭

---

## 檢查清單

- [ ] 每個類別/方法只負責一件事（SRP）
- [ ] Service 透過 constructor DI 注入依賴（DIP）
- [ ] 依賴介面而非具體實作
- [ ] 一個 Step Pattern 對應一個 class（或緊密相關組合）
- [ ] 所有 TODO / META 標記已清除
- [ ] 使用 `ILogger<T>` + structured logging（不用 Console.WriteLine）
- [ ] 日誌使用 `{PropertyName}` 佔位符，不用字串拼接
- [ ] Controllers/Services/Repositories 在正確的 namespace/目錄
- [ ] DI 欄位宣告為 `readonly`
- [ ] DTO 使用 `record`
- [ ] 狀態映射使用 `switch` expression
- [ ] 專案啟用 `<Nullable>enable</Nullable>`
- [ ] 使用 Early Return 減少巢狀
- [ ] 重複資料提升為 `static readonly` 常數
- [ ] 使用 `FirstOrDefault() ?? throw` 處理可能為空的查詢
- [ ] 使用 `nameof()` 取代硬編碼名稱字串
- [ ] 命名清晰表達用途（無縮寫）
