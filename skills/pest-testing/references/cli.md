# CLI API 參考
> 來源：https://pestphp.com/docs/cli-api-reference
> 最後更新：2026-02-23

---

## 設定（Configuration）

| 選項 | 說明 |
|------|------|
| `--init` | 初始化標準 Pest 設定 |
| `--bootstrap <file>` | 測試執行前引入的 PHP 腳本 |
| `-c\|--configuration <file>` | 指定 XML 設定檔 |
| `--no-configuration` | 忽略 phpunit.xml |
| `--extension <class>` | 註冊測試執行器擴充 |
| `--no-extensions` | 不載入 PHPUnit 擴充 |
| `-d <key[=value]>` | 設定 php.ini 值 |
| `--cache-directory <dir>` | 指定快取目錄 |
| `--generate-configuration` | 產生設定檔 |
| `--migrate-configuration` | 遷移設定檔格式 |
| `--generate-baseline <file>` | 產生問題基準線 |
| `--use-baseline <file>` | 使用基準線忽略問題 |
| `--test-directory` | 指定測試目錄（預設：tests） |

---

## 選擇測試（Selection）

| 選項 | 說明 |
|------|------|
| `--bail` | 第一個失敗就停止 |
| `--ci` | 忽略 `->only()` 並執行整個套件 |
| `--todos` | 列出 todo 測試 |
| `--retry` | 優先執行之前失敗的測試 |
| `--list-suites` | 列出可用的測試套件 |
| `--testsuite <name>` | 只執行指定測試套件 |
| `--exclude-testsuite <name>` | 排除指定測試套件 |
| `--list-groups` | 列出可用的測試群組 |
| `--group <name>` | 只執行指定群組 |
| `--exclude-group <name>` | 排除指定群組 |
| `--list-tests` | 列出所有測試 |
| `--filter <pattern>` | 過濾要執行的測試 |
| `--exclude-filter <pattern>` | 排除符合模式的測試 |
| `--dirty` | 只執行有 Git 未提交變更的測試 |

---

## 執行選項（Execution）

| 選項 | 說明 |
|------|------|
| `--parallel` | 平行執行測試 |
| `--processes=N` | 指定平行執行的程序數（搭配 `--parallel`） |
| `--update-snapshots` | 更新 `toMatchSnapshot` 快照 |
| `--order-by <order>` | 執行順序：default\|defects\|depends\|duration\|no-depends\|random\|reverse\|size |
| `--random-order-seed <N>` | 隨機排序的種子值 |
| `--stop-on-error` | 遇到錯誤就停止 |
| `--stop-on-failure` | 遇到失敗就停止 |
| `--stop-on-skipped` | 遇到跳過就停止 |
| `--fail-on-warning` | 將警告視為失敗 |
| `--fail-on-risky` | 將 risky 測試視為失敗 |
| `--enforce-time-limit` | 依測試大小強制時間限制 |
| `--default-time-limit <sec>` | 無宣告大小測試的超時秒數 |
| `--disallow-test-output` | 嚴格禁止測試輸出 |

---

## 輸出報告（Reporting）

| 選項 | 說明 |
|------|------|
| `--colors <flag>` | 輸出顏色：never\|auto\|always |
| `--no-progress` | 停用進度輸出 |
| `--no-output` | 停用所有輸出 |
| `--compact` | 使用簡潔輸出格式 |
| `--testdox` | 使用 TestDox 格式 |
| `--teamcity` | 使用 TeamCity 格式 |
| `--debug` | 使用除錯資訊輸出 |
| `--profile` | 顯示最慢的 10 個測試 |

---

## 日誌（Logging）

| 選項 | 說明 |
|------|------|
| `--log-junit <file>` | 輸出 JUnit XML |
| `--log-teamcity <file>` | 輸出 TeamCity 格式 |
| `--testdox-html <file>` | 輸出 TestDox HTML |
| `--testdox-text <file>` | 輸出 TestDox 純文字 |

---

## 程式碼覆蓋率（Code Coverage）

| 選項 | 說明 |
|------|------|
| `--coverage` | 產生覆蓋率報告 |
| `--coverage --min=<n>` | 設定最低覆蓋率，未達到則失敗 |
| `--coverage --exactly=<n>` | 精確要求覆蓋率 |
| `--coverage-clover <file>` | Clover XML 格式 |
| `--coverage-cobertura <file>` | Cobertura XML 格式 |
| `--coverage-html <dir>` | HTML 格式 |
| `--coverage-php <file>` | 序列化覆蓋率資料 |
| `--coverage-text=<file>` | 純文字格式 |
| `--coverage-xml <dir>` | XML 格式 |
| `--coverage-filter <dir>` | 指定覆蓋率分析目錄 |
| `--no-coverage` | 忽略設定檔中的覆蓋率設定 |

---

## Mutation Testing

| 選項 | 說明 |
|------|------|
| `--mutate` | 執行 mutation testing |
| `--mutate --parallel` | 平行執行 mutation testing |
| `--mutate --min=<n>` | 設定最低 mutation score |
| `--mutate --id=<id>` | 只執行指定 ID 的 mutation |
| `--mutate --covered-only` | 只對有測試覆蓋的程式碼產生 mutation |
| `--mutate --everything` | 對所有類別產生 mutation |
| `--mutate --bail` | 第一個未測試的 mutation 就停止 |
| `--mutate --class=<class>` | 只對指定類別產生 mutation |
| `--mutate --ignore=<class>` | 忽略指定類別 |
| `--mutate --clear-cache` | 清除 mutation 快取 |
| `--mutate --no-cache` | 不使用快取 |
| `--mutate --retry` | 優先執行未測試的 mutation |
| `--mutate --stop-on-uncovered` | 遇到未覆蓋的 mutation 就停止 |
| `--mutate --stop-on-untested` | 遇到未測試的 mutation 就停止 |

---

## 型別覆蓋率

| 選項 | 說明 |
|------|------|
| `--type-coverage` | 產生型別覆蓋率報告 |
| `--type-coverage --min=<n>` | 設定最低型別覆蓋率 |
| `--type-coverage --compact` | 只顯示未達 100% 的檔案 |

---

## Sharding（分片）

```bash
./vendor/bin/pest --shard=1/5   # 執行第 1 片（共分 5 片）
./vendor/bin/pest --shard=2/5   # 執行第 2 片
```
