# 測試指令參考

撰寫測試說明文件（README 或 SKILL）時，**必須列出以下各種情境的完整指令範例**，讓開發者一眼就能複製貼上。

---

## E2E 測試（Playwright）

```bash
# 預設（無頭模式，CI 用）
npx playwright test

# 有頭模式（本機除錯，看瀏覽器跑）
npx playwright test --headed

# 指定瀏覽器
npx playwright test --project=chromium
npx playwright test --project=firefox

# 只跑冒煙測試
npx playwright test --grep "@smoke"

# 只跑 Happy Flow
npx playwright test --grep "@happy"

# 跑單一測試檔
npx playwright test tests/e2e/checkout.spec.ts

# 跑單一測試（依名稱）
npx playwright test -g "用戶可以完成結帳流程"

# 顯示測試報告
npx playwright show-report

# 互動式 UI 模式（最好用的除錯方式）
npx playwright test --ui
```

---

## 整合測試（PHPUnit + wp-env）

```bash
# 跑所有整合測試
npx wp-env run tests-cli vendor/bin/phpunit

# 只跑指定 Test Class
npx wp-env run tests-cli vendor/bin/phpunit --filter=OrderServiceTest

# 只跑指定 test method
npx wp-env run tests-cli vendor/bin/phpunit --filter="test_建立訂單成功"

# 只跑冒煙測試群組
npx wp-env run tests-cli vendor/bin/phpunit --group=smoke

# 只跑 Happy Flow 群組
npx wp-env run tests-cli vendor/bin/phpunit --group=happy

# 跑指定目錄
npx wp-env run tests-cli vendor/bin/phpunit tests/Integration/

# 輸出詳細結果
npx wp-env run tests-cli vendor/bin/phpunit --verbose

# 產生 coverage 報告
npx wp-env run tests-cli vendor/bin/phpunit --coverage-html coverage/
```

---

## 單元測試（Vitest - TypeScript / React）

```bash
# 跑所有單元測試
npx vitest run

# Watch 模式（開發時用）
npx vitest

# 跑單一測試檔
npx vitest run src/utils/validator.test.ts

# 依測試名稱過濾
npx vitest run -t "應正確驗證 email 格式"

# UI 模式
npx vitest --ui

# 產生 coverage 報告
npx vitest run --coverage

# 只跑有改動的相關測試
npx vitest --changed
```

---

## React Integration Test（@testing-library/react + Vitest）

```bash
# 跑所有 IT
npx vitest run tests/integration/

# 跑單一 feature 的測試
npx vitest run tests/integration/order.test.tsx

# 依標籤過濾
npx vitest run -t "@smoke"
```

---

## Python 測試（pytest）

```bash
# 跑所有測試
pytest

# 跑單一檔案
pytest tests/test_order.py

# 跑單一測試函式
pytest tests/test_order.py::test_create_order_success

# 依標記過濾
pytest -m smoke
pytest -m "smoke and not slow"

# 顯示詳細輸出
pytest -v

# 停在第一個失敗
pytest -x

# 產生 coverage
pytest --cov=src --cov-report=html
```

---

## 撰寫指引

1. **必列的五種情境**：全部跑、指定檔案、指定測試名稱、依標籤過濾、產生 coverage
2. **本地 vs CI 差異要標註**：例如 `--headed` 本機才有意義
3. **明確寫出測試檔案位置**：避免開發者猜路徑
4. **除錯模式優先**：把 UI 模式、watch 模式放在顯眼位置
