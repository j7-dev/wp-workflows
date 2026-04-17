# Serena MCP Onboarding 實務

Greenfield 場景的核心依賴是 **Serena MCP 的語意化代碼閱讀能力**。若未正確 onboarding，後續所有「全檔案讀取」都會大幅失準或需降級到低效率的 bash 讀取。

---

## Step 0-1：檢查 `.serena` 目錄

```bash
ls -la .serena 2>/dev/null
```

- **存在** → 跳到 Step 0-3，直接進入 Step 1
- **不存在** → 執行 Step 0-2 進行初始化

---

## Step 0-2：執行 Onboarding

使用 serena MCP 的 `onboarding` 工具：

```
呼叫 mcp__serena__onboarding
等待工具回傳成功訊息
確認 .serena/project.yml 被建立
```

若失敗：
- 報告錯誤原因
- 提示用戶可能需手動調整 `.serena/project.yml` 的路徑或 language
- **繼續**使用 Grep + Read 降級方案，但在最終報告中標注「Serena 不可用，精度下降」

---

## Step 0-3：Onboarding 後的實務

Serena 成功後，後續閱讀代碼的優先順序：

| 任務                     | 推薦工具                                   | 何時用 bash/Read    |
| ------------------------ | ------------------------------------------ | ------------------- |
| 掌握檔案骨架             | `mcp__serena__get_symbols_overview`        | 否                  |
| 讀某個類別/函式           | `mcp__serena__find_symbol` + `include_body`| 否                  |
| 找出誰呼叫某個函式       | `mcp__serena__find_referencing_symbols`    | 否                  |
| 搜尋 pattern             | `mcp__serena__search_for_pattern`          | 否                  |
| 列目錄                   | `mcp__serena__list_dir`                    | 否                  |
| 讀整個小檔（< 100 行）   | `Read`                                     | 是（Serena 成本較高）|
| 讀純文字/設定檔          | `Read`                                     | 是                  |

---

## 核心心法：不要讀超過需要的量

- **先看骨架**：`get_symbols_overview` 取得目錄或檔案的 class / function 列表。
- **只讀需要的 symbol body**：例如要寫 CLAUDE.md 的 hook 章節，就只讀 hook 類別的主要方法。
- **已讀過的檔案不要再用 symbolic 工具分析**：已有完整內容時直接在記憶中處理。

---

## 回報格式

Step 0 完成時回報：

```
✅ Step 0：Serena Onboarding
- 狀態：{已存在 / 已完成初始化 / 失敗（降級到 bash）}
- 偵測到的語言：{python/typescript/php/...}
- 可用工具：{serena / bash-only}
```

---

## 降級方案：Serena 不可用時

| Serena 工具                    | bash/Read 替代                                        |
| ------------------------------ | ----------------------------------------------------- |
| `get_symbols_overview`         | `Grep "^(class\|function\|def)" --glob "*.ext"`       |
| `find_symbol`                  | `Grep "class XXX" -A 50` 然後 `Read` 該區段           |
| `find_referencing_symbols`     | `Grep "XXX(" --glob "*.ext"`                          |
| `search_for_pattern`           | `Grep`（直接用）                                      |

降級時效率顯著下降，務必在最終報告中註明，方便用戶了解文件精度的侷限。
