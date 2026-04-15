---
name: aibdd.auto.csharp.it.schema-analysis
description: >
  C# IT Schema Analysis。比對 .feature + api.yml + erm.dbml 與現有 EF Core Models/Migrations 的一致性，
  確保資料庫基礎設施就緒後才進入紅燈階段。
---

# C# IT Schema Analysis

Red 階段的第一步：驗證資料庫結構與 spec 一致，缺失則補齊 EF Core Entity、DbContext 配置、Migration。

## 角色

Schema consistency checker — 確保 EF Core Models 與 Migrations 對齊 `.feature` + `api.yml` + `erm.dbml`。

## 輸入

- `${FEATURE_SPECS_DIR}/*.feature` — Gherkin feature files
- `${API_SPECS_DIR}/api.yml` — OpenAPI spec
- `${ENTITY_SPECS_DIR}/erm.dbml` — Entity-Relationship Model (DBML)
- `${CSHARP_MODEL_DIR}/*.cs` — 現有 EF Core Entity 類別
- `${CSHARP_DATA_DIR}/AppDbContext.cs` — 現有 DbContext
- `${CSHARP_APP_DIR}/Migrations/` — 現有 EF Core Migrations

## 分析步驟

1. 讀取 spec 檔（feature + api.yml + erm.dbml）
2. 掃描現有 Entity classes in `${CSHARP_MODEL_DIR}/`
3. 掃描 `AppDbContext.cs` 的 `DbSet<T>` 與 `OnModelCreating`
4. 掃描 `Migrations/` 目錄
5. 比對：DBML 的 table vs DbSet、columns vs properties、enums vs C# enums、關聯 vs navigation properties
6. 標註缺失項目

## GO/NO-GO 決策表

| 情況 | 決策 | 動作 |
|------|------|------|
| Entity + DbContext + Migration 完全一致 | GO | 進入 Step Template |
| Entity 存在但缺 column | NO-GO | 更新 Entity → 新 Migration → `database update` |
| Entity 不存在 | NO-GO | 建立 Entity → 註冊 DbSet → 新 Migration |
| Enum 不存在 | NO-GO | 建立 C# enum |
| 關聯（Foreign Key）不存在 | NO-GO | 補 Navigation Property + `HasOne/HasMany` 配置 |
| DBML 與 Entity 型別不符（string vs int） | NO-GO | 修正 Entity property 型別 |

---

## 修復流程

### 新增 Entity

```csharp
// ${CSHARP_MODEL_DIR}/LessonProgress.cs
namespace ProjectName.Models;

public class LessonProgress
{
    public string UserId { get; set; } = null!;
    public int LessonId { get; set; }
    public int Progress { get; set; }
    public ProgressStatus Status { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 註冊 DbSet + 配置

```csharp
// ${CSHARP_DATA_DIR}/AppDbContext.cs
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LessonProgress>(entity =>
        {
            entity.ToTable("lesson_progresses");
            entity.HasKey(e => new { e.UserId, e.LessonId });     // 複合主鍵
            entity.Property(e => e.Status).HasConversion<string>(); // enum 存字串
            entity.Property(e => e.UserId).HasMaxLength(64);
        });
    }
}
```

### 建立 Enum

```csharp
// ${CSHARP_MODEL_DIR}/ProgressStatus.cs
namespace ProjectName.Models;

public enum ProgressStatus
{
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED
}
```

### 關聯（Foreign Key + Navigation）

```csharp
public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!; // navigation
    public string ProductId { get; set; } = null!;
    public int Quantity { get; set; }
}

// OnModelCreating
modelBuilder.Entity<OrderItem>(entity =>
{
    entity.HasOne(e => e.Order)
          .WithMany(o => o.Items)
          .HasForeignKey(e => e.OrderId)
          .OnDelete(DeleteBehavior.Cascade);
});
```

### Migration 命令

```bash
# 新增 migration
dotnet ef migrations add AddLessonProgress --project src/${ProjectName} --startup-project src/${ProjectName}

# 套用到本地 DB
dotnet ef database update --project src/${ProjectName} --startup-project src/${ProjectName}

# 回滾（若需要）
dotnet ef migrations remove --project src/${ProjectName}
```

### CustomWebApplicationFactory 的資料庫建立

IT 測試使用 Testcontainers，DB 會透過 `EnsureCreatedAsync()` 自動建立 schema（或執行 migration）：

```csharp
public async Task InitializeAsync()
{
    await _postgres.StartAsync();
    using var scope = Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    // 或 await db.Database.MigrateAsync();（若要測試 migration 本身）
}
```

---

## EF Core 特化規則

1. **Fluent API 優先於 Data Annotations**
   - 複合 Key 只能用 Fluent API（`HasKey(e => new { ... })`）
   - `[Table]` `[Column]` 可混用，但保持一致風格

2. **Composite Key**
   ```csharp
   entity.HasKey(e => new { e.UserId, e.LessonId });
   ```

3. **Enum 轉換**
   ```csharp
   entity.Property(e => e.Status).HasConversion<string>();
   ```
   → DB 存 `"IN_PROGRESS"` 字串而非數字（可讀性高）

4. **Table 命名 snake_case**
   ```csharp
   entity.ToTable("lesson_progresses");
   ```
   與 DBML 定義一致。Postgres 慣例為 snake_case。

5. **Column 自訂命名**
   ```csharp
   entity.Property(e => e.UserId).HasColumnName("user_id");
   ```
   （或全域轉換器，但不建議）

6. **Nullable 標記**
   - 可為 null 的 reference type：`string?`
   - 可為 null 的 value type：`int?`
   - 非 null 的 reference type 初始化：`public string Name { get; set; } = null!;`

7. **Property 長度限制**
   ```csharp
   entity.Property(e => e.Email).HasMaxLength(255);
   ```

---

## DBML → EF Core 對照範例

```dbml
Table lesson_progresses {
  user_id varchar(64) [not null]
  lesson_id int [not null]
  progress int [not null]
  status varchar(32) [not null, note: "IN_PROGRESS | COMPLETED | NOT_STARTED"]
  updated_at timestamp

  indexes {
    (user_id, lesson_id) [pk]
  }
}
```

↓

```csharp
public class LessonProgress
{
    public string UserId { get; set; } = null!;
    public int LessonId { get; set; }
    public int Progress { get; set; }
    public ProgressStatus Status { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// OnModelCreating
modelBuilder.Entity<LessonProgress>(entity =>
{
    entity.ToTable("lesson_progresses");
    entity.HasKey(e => new { e.UserId, e.LessonId });
    entity.Property(e => e.UserId).HasMaxLength(64);
    entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(32);
});
```

---

## 完成條件

- [ ] DBML 定義的每個 table 在 C# 都有對應 Entity 類別
- [ ] `AppDbContext` 註冊了所有 `DbSet<T>`
- [ ] `OnModelCreating` 配置了所有複合 Key、enum 轉換、table 命名
- [ ] 所有 enum 類型已建立
- [ ] 所有 navigation properties + foreign keys 正確配置
- [ ] Migration 已建立並可成功執行
- [ ] `dotnet build` 無錯誤
