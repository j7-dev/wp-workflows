---
name: aibdd.auto.csharp.it.step-template
description: >
  C# IT Step Template 生成器。從 Gherkin Feature 解析每個 Given/When/Then 步驟，
  分類為 Handler 類型，產出 SpecFlow Step Definition 骨架（含 TODO 標註）。
---

# C# IT Step Template 生成器

紅燈流程的第二步：將 `.feature` 轉換為 SpecFlow step definition 骨架。每個 step 含 TODO 標註指向對應 handler skill，等 Red Implementation 階段填入實作。

## 角色

Step definition skeleton generator — 從 Gherkin 產生 C# step classes，每個 step 先寫 `throw new PendingStepException()` 作為佔位。

## 輸入

- `${FEATURE_SPECS_DIR}/*.feature` — Target feature file
- `${CSHARP_STEPS_DIR}/` — 現有 step definitions（禁止覆寫）

## 前置檢查

1. Symlink or copy `.feature` files to `${CSHARP_FEATURES_DIR}/`
2. 掃描 `${CSHARP_STEPS_DIR}/**/*.cs` 找出已存在的 step pattern，避免重複產生
3. 逐一解析 feature 的 Background / Scenario / Scenario Outline / Examples

## 句型分類決策樹

| Gherkin 關鍵字 | 語句特徵 | Handler Type | Skill |
|---|---|---|---|
| Given | 描述實體狀態（「…的…為」「有」「存在」「包含」） | aggregate-given | `/aibdd.auto.csharp.it.handlers.aggregate-given` |
| Given | 過去式動作（「已訂閱」「已建立」「已完成」） | command | `/aibdd.auto.csharp.it.handlers.command` |
| When | 寫入動作（「更新」「提交」「建立」「刪除」「新增」） | command | `/aibdd.auto.csharp.it.handlers.command` |
| When | 讀取動作（「查詢」「取得」「列出」「檢視」） | query | `/aibdd.auto.csharp.it.handlers.query` |
| Then | 驗證 DB 狀態（「應為」「應存在」「不應存在」） | aggregate-then | `/aibdd.auto.csharp.it.handlers.aggregate-then` |
| Then | 驗證查詢結果（「結果應包含」「應顯示」「應回傳」） | readmodel-then | `/aibdd.auto.csharp.it.handlers.readmodel-then` |
| Then | 操作結果（「操作成功」「操作失敗」「HTTP 狀態碼應為 …」） | success-failure | `/aibdd.auto.csharp.it.handlers.success-failure` |

若有疑義，參考 `chapter04/.claude/skills/aibdd-form-bdd-analysis/references/web-backend/句型分析方針.md`（若存在）。

---

## 骨架格式

### 基本 Step Class

```csharp
using TechTalk.SpecFlow;

namespace ProjectName.IntegrationTests.Steps.Lesson.AggregateGiven;

/// <summary>
/// TODO: [事件風暴部位: Aggregate - LessonProgress]
/// TODO: 參考 /aibdd.auto.csharp.it.handlers.aggregate-given 實作
/// </summary>
[Binding]
public class LessonProgressGivenSteps
{
    private readonly ScenarioContext _ctx;

    public LessonProgressGivenSteps(ScenarioContext ctx) => _ctx = ctx;

    [Given(@"用戶 ""(.*)"" 在課程 (.*) 的進度為 (.*)%，狀態為 ""(.*)""")]
    public void GivenUserLessonProgress(string userName, int lessonId, int progress, string status)
    {
        // TODO: [事件風暴部位: Aggregate - LessonProgress]
        // TODO: 參考 /aibdd.auto.csharp.it.handlers.aggregate-given 實作
        throw new PendingStepException();
    }
}
```

### Async Command Skeleton

```csharp
using System.Threading.Tasks;
using TechTalk.SpecFlow;

namespace ProjectName.IntegrationTests.Steps.Lesson.Commands;

[Binding]
public class UpdateVideoProgressSteps
{
    private readonly ScenarioContext _ctx;

    public UpdateVideoProgressSteps(ScenarioContext ctx) => _ctx = ctx;

    [When(@"用戶 ""(.*)"" 更新課程 (.*) 的影片進度為 (.*)%")]
    public async Task WhenUpdateProgress(string userName, int lessonId, int progress)
    {
        // TODO: [事件風暴部位: Command]
        // TODO: 參考 /aibdd.auto.csharp.it.handlers.command 實作
        await Task.CompletedTask;
        throw new PendingStepException();
    }
}
```

### DataTable Skeleton

```csharp
[Given(@"系統中有以下用戶：")]
public void GivenUsersExist(Table table)
{
    // TODO: [事件風暴部位: Aggregate - User]
    // TODO: 參考 /aibdd.auto.csharp.it.handlers.aggregate-given 實作（DataTable 版本）
    throw new PendingStepException();
}
```

### DocString Skeleton

```csharp
[Given(@"用戶 ""(.*)"" 的個人簡介為：")]
public void GivenUserBio(string userName, string bioText)
{
    throw new PendingStepException();
}
```

---

## 檔案組織規則

### 命名慣例

| 項目 | 格式 | 範例 |
|------|------|------|
| 檔名 | `{Feature}{HandlerType}Steps.cs` | `LessonProgressGivenSteps.cs` |
| 類別名 | `{Feature}{HandlerType}Steps` | `LessonProgressGivenSteps` |
| Namespace | `{Project}.IntegrationTests.Steps.{Subdomain}.{HandlerType}` | `ProjectName.IntegrationTests.Steps.Lesson.AggregateGiven` |

### 目錄結構

```
tests/${ProjectName}.IntegrationTests/Steps/
├── Lesson/                       # {Subdomain}
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
├── Order/                        # 另一個 subdomain
│   └── ...
└── CommonThen/                   # 跨 feature 共用
    ├── SuccessSteps.cs
    └── FailureSteps.cs
```

### Handler 路由表（含目錄）

| Handler Type | Skill | 目錄 |
|--------------|-------|------|
| aggregate-given | `/aibdd.auto.csharp.it.handlers.aggregate-given` | `AggregateGiven/` |
| command | `/aibdd.auto.csharp.it.handlers.command` | `Commands/` |
| query | `/aibdd.auto.csharp.it.handlers.query` | `Query/` |
| aggregate-then | `/aibdd.auto.csharp.it.handlers.aggregate-then` | `AggregateThen/` |
| readmodel-then | `/aibdd.auto.csharp.it.handlers.readmodel-then` | `ReadModelThen/` |
| success-failure | `/aibdd.auto.csharp.it.handlers.success-failure` | `CommonThen/` |

---

## SpecFlow 參數對應

### Regex 模式

| Gherkin 寫法 | SpecFlow Regex | C# 型別 |
|---|---|---|
| `"Alice"` | `""(.*)""` | `string` |
| `5` | `(.*)` | `int` |
| `80` | `(.*)` | `int` |
| `3.14` | `(.*)` | `double` / `decimal` |
| （任意文字） | `(.*)` | `string` |

### 範例對照

| Gherkin | C# Attribute |
|---|---|
| `Given 用戶 "Alice" 的進度為 80%` | `[Given(@"用戶 ""(.*)"" 的進度為 (.*)%")]` |
| `When 查詢課程 1 的進度` | `[When(@"查詢課程 (.*) 的進度")]` |
| `Then 操作成功` | `[Then(@"操作成功")]` |

### DataTable / DocString

```csharp
// DataTable
[Given(@"系統中有以下用戶：")]
public void GivenUsers(Table table) { /* ... */ }

// DocString（多行字串）
[Given(@"用戶 ""(.*)"" 的個人簡介為：")]
public void GivenBio(string userName, string multilineText) { /* ... */ }
```

---

## 關鍵規則

1. **R1: 絕不覆寫既有 step definition** — 先掃描現有 steps
2. **R2: 一個 subdomain + handler type 對應一個類別檔案** — 不混合
3. **R3: TODO 標註必須含 handler type + skill 路徑** — 供 Red Implementation 階段引用
4. **R4: 使用 `PendingStepException`** — 不用空方法、不用 `Assert.Fail`
5. **R5: 只 constructor injection `ScenarioContext`** — 其他依賴在 Red Implementation 才引入
6. **R6: SpecFlow regex 必須精確匹配 Gherkin 文字** — 空格、標點都要一致
7. **R7: 涉及 HTTP/async 的 step 使用 `async Task`** — Command 與 Query 建議 async，避免阻塞
8. **R8: 複用 common steps** — 「操作成功」「操作失敗」放在 `CommonThen/`，避免每個 feature 重複

## 完成條件

- [ ] Feature 中每個 Given/When/Then step 都有對應 step definition
- [ ] 所有 step 都有 TODO 標註（含 handler type + skill 路徑）
- [ ] 所有 step 都 `throw new PendingStepException()`
- [ ] 沒有重複的 step pattern
- [ ] 目錄結構符合 `Steps/{Subdomain}/{HandlerType}/` 慣例
- [ ] 檔名與 namespace 一致
- [ ] `dotnet build` 無錯誤（PendingStepException 可編譯通過）
