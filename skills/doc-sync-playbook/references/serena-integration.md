# Serena MCP 整合指南

`git diff` 只告訴你「哪些行變了」，但不告訴你「這些變更影響了誰」。
Serena MCP 提供語意層面的代碼分析，是文件同步的關鍵工具。

---

## 使用前提

**先檢查 `.serena` 目錄是否存在**。若不存在，使用 `mcp__serena__onboarding` 初始化專案。

onboarding 會讓 Serena 建立代碼索引，後續所有 symbolic 操作才能正常運作。

---

## 核心場景對照

### 場景 1：確認新增 class 的實際位置與職責

拿到 `git diff` 看到新增檔案 `src/Service/FooService.php`，要確認寫入 `CLAUDE.md` 的描述是否準確：

```
mcp__serena__get_symbols_overview(relative_path="src/Service/FooService.php")
  → 拿到所有 public method 清單
mcp__serena__find_symbol(name_path="FooService", relative_path="src/Service/FooService.php", include_body=true)
  → 確認 class 的完整定義（僅在需要時讀 body）
```

寫入文件時只描述**公開 API** 與**單一職責**，不複製程式碼。

---

### 場景 2：重新命名 class，確認影響範圍

```
mcp__serena__find_referencing_symbols(name_path="OldClass", relative_path="src/Foo/OldClass.php")
  → 拿到所有引用位置
```

依引用數量決定：
- **0 個引用**：純內部變更，文件可能不需更新
- **1-5 個引用**：更新文件 + 檢查這些引用檔案是否也在文件中被提及
- **>5 個引用**：重大重構，`CLAUDE.md` 架構圖 + 相關 rules 都要檢查

---

### 場景 3：REST API 端點變更

`register_rest_route` 的變更通常分散在多個檔案：

```
mcp__serena__search_for_pattern(
  substring_pattern="register_rest_route",
  relative_path="src/"
)
  → 拿到所有註冊位置
```

每個端點記錄：**HTTP method + route + controller class + 權限 callback**。

---

### 場景 4：WordPress Hook 追蹤

```
mcp__serena__search_for_pattern(
  substring_pattern="do_action\\(|apply_filters\\(",
  relative_path="src/"
)
  → 拿到所有自訂 hook 發佈點
```

每個 hook 記錄：**名稱 + 發佈位置 + 傳遞參數 + 用途**。

---

## 效率原則

Serena 是**語意工具**，不是 `cat`。遵守以下原則：

1. **先概覽、後細讀**：`get_symbols_overview` → 決定要讀哪個 symbol → `find_symbol(include_body=true)`
2. **不讀整個檔案**：除非真的需要理解所有內容，否則用 symbolic 工具
3. **相對路徑優先**：所有工具的 `relative_path` 參數能大幅縮小搜尋範圍，提升速度
4. **`search_for_pattern` 用於模糊搜尋**：當 symbol name 不確定時才使用

---

## 降級方案（Serena 不可用）

若 Serena MCP 啟動失敗或 onboarding 失敗：

1. 降級使用 `Grep` 工具做 pattern 搜尋
2. 降級使用 `Read` 工具逐一讀取檔案（警告用戶效率下降）
3. 在最終報告中註記「未使用 Serena 分析，可能遺漏引用關係」
