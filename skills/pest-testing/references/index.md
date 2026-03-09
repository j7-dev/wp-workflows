# Pest v3/v4 知識庫索引
> 最後更新：2026-02-23

## 檔案清單

| 檔案 | 主題 | 來源頁面 |
|------|------|---------|
| installation.md | 安裝與設定 | /docs/installation, /docs/configuring-tests |
| writing-tests.md | 撰寫測試 | /docs/writing-tests |
| assertions.md | Assertions | /docs/expectations, /docs/custom-expectations |
| lifecycle.md | 生命週期 Hooks | /docs/hooks, /docs/global-hooks |
| datasets.md | 資料驅動測試 | /docs/datasets |
| mocking.md | Mock/Spy/Fake | /docs/mocking |
| exceptions.md | 例外測試 | /docs/exceptions |
| filtering.md | 篩選與跳過 | /docs/skipping-tests, /docs/grouping-tests, /docs/filtering-tests |
| advanced.md | 進階語法 | /docs/higher-order-testing, /docs/custom-helpers, /docs/snapshot-testing |
| arch-testing.md | 架構測試 | /docs/arch-testing, /docs/test-dependencies |
| plugins.md | 外掛與擴充 | /docs/plugins, /docs/creating-plugins |
| cli.md | CLI | /docs/cli-api-reference |
| ci.md | CI/CD | /docs/continuous-integration |
| coverage.md | 覆蓋率 | /docs/test-coverage, /docs/type-coverage, /docs/mutation-testing |
| optimizing.md | 效能 | /docs/optimizing-tests |
| misc.md | 其他 | /docs/upgrade-guide, /docs/migrating-from-phpunit-guide |
| wp-pest.md | wp-pest | https://raw.githubusercontent.com/dingo-d/wp-pest/main/README.md |

---

## 快速導覽

### 新手入門
1. **[installation.md](installation.md)** — 安裝 Pest 及設定 `Pest.php`
2. **[writing-tests.md](writing-tests.md)** — `test()`, `it()`, `describe()` 基本語法

### 撰寫斷言
3. **[assertions.md](assertions.md)** — 完整 Expectation API 清單（70+ 方法）及自訂 Expectations

### 測試組織
4. **[lifecycle.md](lifecycle.md)** — `beforeEach`, `afterEach`, `beforeAll`, `afterAll` 及全域 Hooks
5. **[datasets.md](datasets.md)** — 資料驅動測試、共享資料集、笛卡爾積組合
6. **[filtering.md](filtering.md)** — 跳過測試、分組、CLI 篩選選項

### 進階功能
7. **[mocking.md](mocking.md)** — Mockery 使用、方法期望、回傳值、呼叫次數
8. **[exceptions.md](exceptions.md)** — `throws()`, `throwsIf()`, `toThrow()`, `fail()`
9. **[advanced.md](advanced.md)** — Higher Order Testing、自訂 Helpers、Snapshot Testing

### 架構與品質
10. **[arch-testing.md](arch-testing.md)** — 架構規則期望、Presets（php/security/laravel/strict）、Test Dependencies
11. **[coverage.md](coverage.md)** — 程式碼覆蓋率、型別覆蓋率、Mutation Testing

### 部署與工具
12. **[plugins.md](plugins.md)** — 官方外掛（Faker/Laravel/Livewire）及建立外掛
13. **[cli.md](cli.md)** — 完整 CLI 選項參考
14. **[ci.md](ci.md)** — GitHub Actions / GitLab CI / Bitbucket Pipelines 設定
15. **[optimizing.md](optimizing.md)** — 平行測試、效能分析、精簡輸出

### 遷移
16. **[misc.md](misc.md)** — Pest 1.x → 2.x → 3.x → 4.x 升級指南、從 PHPUnit 遷移
17. **[wp-pest.md](wp-pest.md)** — WordPress 主題/外掛測試整合

---

## 版本資訊

| 版本 | PHP 需求 | PHPUnit 版本 |
|------|---------|-------------|
| Pest 4.x | PHP 8.3+ | PHPUnit 12 |
| Pest 3.x | PHP 8.2+ | PHPUnit 11 |
| Pest 2.x | PHP 8.1+ | PHPUnit 10 |
| Pest 1.x | PHP 7.3+ | PHPUnit 9 |
