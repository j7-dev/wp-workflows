# CI 報告參考文件

> **注意（ wp-workflows CI 架構）**
>
> 在此架構中，agent **只需**將 `test-report.md` 寫入磁碟路徑
> `output/playwright/browser-test/test-report.md`。
> 截圖/影片上傳 CDN 及 Issue Comment 發佈均由 CI workflow 的後續 steps 自動處理。
> **請勿在 CI 中使用 `gh` CLI 發佈 comment**，否則會與 workflow 發生衝突並導致報告遺失。

當 `GITHUB_ACTIONS=true` 時，測試報告需發佈到 GitHub Issue/PR Comment。

---

## 1. 環境偵測

```bash
# 檢查是否在 CI
IS_CI=$(printenv GITHUB_ACTIONS || echo "false")

# 取得 repo 資訊
REPO="${GITHUB_REPOSITORY}"          # owner/repo
EVENT="${GITHUB_EVENT_NAME}"         # pull_request, push, workflow_dispatch, issues
RUN_ID="${GITHUB_RUN_ID}"            # workflow run ID
RUN_URL="https://github.com/${REPO}/actions/runs/${RUN_ID}"
```

## 2. 提取 PR/Issue Number

```bash
# 從 PR 事件
PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null)

# 從環境變數（workflow_dispatch 觸發時可能透過 inputs 傳入）
ISSUE_NUMBER="${INPUT_ISSUE_NUMBER:-}"

# 從 event payload
if [ -z "$PR_NUMBER" ] && [ -f "$GITHUB_EVENT_PATH" ]; then
  PR_NUMBER=$(jq -r '.pull_request.number // .issue.number // empty' "$GITHUB_EVENT_PATH" 2>/dev/null)
fi
```

## 3. 影片與截圖的 Artifact 處理

CI 環境下影片和截圖無法直接嵌入 Issue Comment。處理方式：

### 影片（上傳為 Artifact）

影片檔案儲存在 `output/playwright/browser-test/videos/`。
需要在 GitHub Actions workflow 中配置 `actions/upload-artifact`：

```yaml
# 在 workflow yml 中配置（非 agent 職責，但需告知用戶）
- name: Upload test videos
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: browser-test-videos
    path: output/playwright/browser-test/videos/
    retention-days: 7
```

在 comment 中引用：

```markdown
[查看測試影片](${RUN_URL}#artifacts)
```

### 截圖（base64 嵌入）

小型截圖可以 base64 嵌入 comment：

```bash
# 將截圖轉為 base64 嵌入 markdown
SCREENSHOT_B64=$(base64 -w 0 "output/playwright/browser-test/screenshots/example.png")
echo "![screenshot](data:image/png;base64,${SCREENSHOT_B64})"
```

> 注意：GitHub 的 base64 圖片嵌入有大小限制。如果截圖超過 1MB，改用 artifact link。

---

## 4. 發佈 Issue/PR Comment

### 發佈到 PR

```bash
gh pr comment "${PR_NUMBER}" --body "$(cat <<'COMMENT_EOF'
{comment_body}
COMMENT_EOF
)"
```

### 發佈到 Issue

```bash
gh issue comment "${ISSUE_NUMBER}" --body "$(cat <<'COMMENT_EOF'
{comment_body}
COMMENT_EOF
)"
```

---

## 5. Comment 模板

遵循 `shared/reporting.md` 的漸進式揭露模式。

### 成功報告模板

```markdown
### 瀏覽器模擬測試結果

**狀態**：✅ 全部通過
**測試頁數**：{N} 頁
**變更範圍**：API {n} / UI 頁面 {n} / UI 組件 {n}

<details>
<summary><b>查看測試明細</b></summary>

#### {頁面名稱} ({URL})
- 結果：✅ 通過
- 變更類型：{type}
- 操作：{操作摘要}

</details>

### 測試影片與截圖
- [查看測試影片]({RUN_URL}#artifacts)
- 截圖：見下方

{embedded_screenshots}

**參照：** [{RUN_ID}]({RUN_URL})
```

### 失敗報告模板

```markdown
### 瀏覽器模擬測試結果

**狀態**：❌ {fail_count} 個測試失敗
**測試頁數**：{N} 頁
**變更範圍**：API {n} / UI 頁面 {n} / UI 組件 {n}

### 失敗項目

#### ❌ {頁面名稱} ({URL})
- 變更類型：{type}
- 失敗原因：{reason}
- Console 錯誤：{errors}
- Network 異常：{failures}

<details>
<summary><b>查看完整測試明細</b></summary>

{full_details}

</details>

### 測試影片與截圖
- [查看測試影片（含失敗過程）]({RUN_URL}#artifacts)
- 截圖：見下方

{embedded_screenshots}

**參照：** [{RUN_ID}]({RUN_URL})
```

---

## 6. 注意事項

- Comment body 長度限制：GitHub Issue Comment 最大 65536 字元
- 超長內容使用 `<details>` 摺疊
- 影片檔案通常較大（10-100MB），**不要**嘗試 base64 嵌入
- `gh` CLI 需要 `GITHUB_TOKEN` 環境變數（GitHub Actions 自動提供）
- 如果 PR number 和 Issue number 都取不到，將報告寫入 `$GITHUB_STEP_SUMMARY`
