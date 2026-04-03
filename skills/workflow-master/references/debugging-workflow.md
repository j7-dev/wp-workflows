# Workflow 系統性除錯流程

## 診斷決策樹

```
Workflow 失敗
│
├─ 1. 是哪個 job/step 失敗？
│   └─ gh run view <run-id> --log-failed
│
├─ 2. 錯誤類型分類
│   ├─ 語法錯誤 → §語法類
│   ├─ 權限/認證 → §權限類
│   ├─ 依賴/環境 → §環境類
│   ├─ 邏輯/條件 → §邏輯類
│   └─ 超時/資源 → §資源類
│
└─ 3. 對症下藥（見各分類）
```

---

## §語法類錯誤

### 常見症狀
- `unexpected value`、`mapping values are not allowed`
- workflow 根本沒觸發（語法錯到 GitHub 無法解析）

### 診斷步驟
1. **actionlint 靜態檢查**（如可用）：`actionlint .github/workflows/*.yml`
2. **YAML 格式驗證**：檢查縮排（spaces not tabs）、冒號後空格、多行字串
3. **表達式語法**：`${{ }}` 內的引號配對、函數名拼寫、context 存取路徑
4. **重複 key**：同一層級出現兩個相同的 key（YAML 靜默覆蓋）

### 常見修正
```yaml
# ❌ 錯誤：mapping value 錯誤
run: echo ${{ secrets.TOKEN }}    # 未加引號，可能被 shell 解析

# ✅ 正確
run: echo "${{ secrets.TOKEN }}"
```

---

## §權限類錯誤

### 常見症狀
- `Resource not accessible by integration`
- `403 Forbidden`、`RequestError [HttpError]: Not Found`
- GITHUB_TOKEN 權限不足

### 診斷步驟
1. **檢查 permissions 區塊**：是否設定了 workflow-level 或 job-level permissions
2. **注意預設行為**：設定任一 permission 後，未列出的全部降為 `none`
3. **Fork PR 限制**：fork 來的 PR 無法存取 secrets，GITHUB_TOKEN 權限為 read-only
4. **OIDC token**：需要 `id-token: write` permission

### 權限最小化模板
```yaml
permissions:
  contents: read        # checkout
  pull-requests: write  # PR comment
  issues: write         # issue comment
  # 只開需要的，其餘自動為 none
```

---

## §環境類錯誤

### 常見症狀
- `command not found`、`No such file or directory`
- Node/Python/PHP 版本不符
- 依賴安裝失敗

### 診斷步驟
1. **Runner 環境**：確認 `runs-on` 對應的 runner image 有預裝所需工具
2. **版本衝突**：setup-node/setup-python 版本 vs lockfile 要求
3. **快取失效**：cache key 不匹配導致每次重裝
4. **PATH 問題**：自訂安裝的工具未加入 `$GITHUB_PATH`

### 環境檢查命令
```yaml
- name: Debug environment
  run: |
    echo "Runner OS: $RUNNER_OS"
    echo "Node: $(node -v 2>/dev/null || echo 'not found')"
    echo "Python: $(python3 --version 2>/dev/null || echo 'not found')"
    echo "Docker: $(docker --version 2>/dev/null || echo 'not found')"
    echo "PATH: $PATH"
```

---

## §邏輯類錯誤

### 常見症狀
- Job 被 skip 但不該被 skip
- 條件判斷結果與預期不符
- 上游 job output 拿不到值

### 診斷步驟
1. **if 條件展開**：手動展開 `${{ }}` 表達式，確認每個 context 的實際值
2. **needs 依賴鏈**：確認 `needs` 列出所有真正依賴的 job
3. **output 傳遞**：確認上游 job 有正確設定 `outputs`，下游用 `needs.<job>.outputs.<name>`
4. **事件 payload**：不同觸發事件的 `github.event` 結構不同
5. **字串 vs 布林**：`'true'`（字串）vs `true`（布林）在 if 條件中行為不同

### 常見修正
```yaml
# ❌ output 拿不到值（忘記在 step 設 id）
- run: echo "version=1.0" >> "$GITHUB_OUTPUT"

# ✅ 正確：step 必須有 id
- id: get-version
  run: echo "version=1.0" >> "$GITHUB_OUTPUT"

# ❌ if 條件比較陷阱
if: github.event.action == 'opened'      # 某些事件沒有 action

# ✅ 安全寫法
if: github.event_name == 'pull_request' && github.event.action == 'opened'
```

---

## §資源類錯誤

### 常見症狀
- `The job running on runner ... has exceeded the maximum execution time`
- `No space left on device`
- `Out of memory`

### 診斷步驟
1. **超時**：檢查 `timeout-minutes`（預設 360 分鐘），是否有無限迴圈
2. **磁碟空間**：大型 mono-repo checkout + node_modules + Docker images
3. **並行限制**：`concurrency` 設定是否導致排隊等待
4. **API rate limit**：大量 gh/git 操作可能觸發 GitHub API 限速

### 空間釋放技巧
```yaml
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet
    sudo rm -rf /opt/ghc
    sudo rm -rf /usr/local/share/boost
    df -h
```

---

## 通用除錯技巧

### 1. 啟用 debug logging
```yaml
# 在 repository secrets 或 workflow env 設定
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

### 2. 使用 tmate 進入互動式 debug（緊急時）
```yaml
- uses: mxschmitt/action-tmate@v3
  if: failure()
  timeout-minutes: 15
```

### 3. 重新執行單一失敗 job
```bash
gh run rerun <run-id> --failed
```

### 4. 檢查 workflow 觸發事件的完整 payload
```yaml
- name: Dump event payload
  run: cat "$GITHUB_EVENT_PATH" | jq .
```
