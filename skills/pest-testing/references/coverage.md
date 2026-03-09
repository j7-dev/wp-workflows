# 覆蓋率
> 來源：https://pestphp.com/docs/test-coverage, https://pestphp.com/docs/type-coverage, https://pestphp.com/docs/mutation-testing
> 最後更新：2026-02-23

---

## 程式碼覆蓋率（Test Coverage）

**需求：** [XDebug 3.0+](https://xdebug.org/docs/install/) 或 [PCOV](https://github.com/krakjoe/pcov)

### 設定

在 `phpunit.xml` 中設定覆蓋率路徑：

```xml
<source>
    <include>
        <directory suffix=".php">./app</directory>
    </include>
</source>
```

使用 XDebug 時需設定環境變數：`XDEBUG_MODE=coverage`

### 產生覆蓋率報告

```bash
./vendor/bin/pest --coverage
```

未覆蓋的行以紅色顯示，多行缺口以 `52..60` 格式表示。

### 最低覆蓋率要求

```bash
./vendor/bin/pest --coverage --min=90   # 未達 90% 則失敗
./vendor/bin/pest --coverage --exactly=99.3  # 精確要求 99.3%
```

### 忽略程式碼

```php
// @codeCoverageIgnoreStart
function getUsers() {
    //
}
// @codeCoverageIgnoreEnd
```

### 輸出格式

| 選項 | 說明 |
|------|------|
| `--coverage-clover <file>` | Clover XML |
| `--coverage-cobertura <file>` | Cobertura XML |
| `--coverage-crap4j <file>` | Crap4J XML |
| `--coverage-html <dir>` | HTML 格式 |
| `--coverage-php <file>` | 序列化資料 |
| `--coverage-text <file>` | 純文字（預設 stdout） |
| `--coverage-xml <dir>` | XML 格式 |

---

## 型別覆蓋率（Type Coverage）

**來源：** [pest-plugin-type-coverage](https://github.com/pestphp/pest-plugin-type-coverage)

測量程式碼中型別宣告的覆蓋率。

### 安裝

```bash
composer require pestphp/pest-plugin-type-coverage --dev
```

### 執行

```bash
./vendor/bin/pest --type-coverage
```

不需要測試就能分析，直接掃描程式碼。

**輸出說明：**
- `rt31` — 第 31 行函式缺少回傳型別
- `pa31` — 第 31 行函式缺少參數型別

### 忽略特定行

```php
protected $except = [ // @pest-ignore-type
    // ...
];
```

### 精簡輸出

只顯示未達 100% 的檔案：

```bash
./vendor/bin/pest --type-coverage --compact
```

### 最低覆蓋率要求

```bash
./vendor/bin/pest --type-coverage --min=100
```

### 輸出到檔案

```bash
./vendor/bin/pest --type-coverage --min=100 --type-coverage-json=my-report.json
```

---

## Mutation Testing（變異測試）

**需求：** XDebug 3.0+ 或 PCOV

### 概念

Mutation Testing 在程式碼中引入小改動（變異），看測試是否能偵測到。這能幫助識別測試套件的弱點。

**評分：**
- **Tested Mutations（已測試）** — 測試成功偵測到變異（測試失敗 = 好）
- **Untested Mutations（未測試）** — 測試未偵測到變異（測試仍通過 = 壞）

### 快速上手

在測試檔案中使用 `covers()` 或 `mutates()` 指定要測試的類別：

```php
covers(TodoController::class); // 或 mutates(TodoController::class);

it('list todos', function () {
    $this->getJson('/todos')->assertStatus(200);
});
```

> `covers()` 同時影響程式碼覆蓋率報告；`mutates()` 只影響 mutation testing。

執行：

```bash
./vendor/bin/pest --mutate
./vendor/bin/pest --mutate --parallel  # 平行執行（建議）
```

### 解讀輸出

```
UNTESTED  app/Http/TodoController.php  > Line 44: ReturnValue - ID: 76d17ad63bb7c307

class TodoController {
    public function index(): array
    {
-        return Todo::all()->toArray();
+        return [];
    }
}

  Mutations: 1 untested
  Score:     33.44%
```

### 最低分數要求

```bash
./vendor/bin/pest --mutate --min=40   # 未達 40% 則失敗
```

### 忽略特定行

```php
public function rules(): array
{
    return [
        'name' => 'required',
        'email' => 'required|email', // @pest-mutate-ignore
    ];
}
```

區塊忽略：

```php
/**
 * @pest-mutate-ignore
 */
protected $guarded = ['id', 'created_at', 'updated_at'];
```

### 常用選項

| 選項 | 說明 |
|------|------|
| `--mutate --id=<id>` | 只執行指定 ID 的 mutation |
| `--mutate --everything` | 對所有類別產生 mutation（資源密集） |
| `--mutate --covered-only` | 只對有測試覆蓋的程式碼 |
| `--mutate --bail` | 第一個未測試的 mutation 就停止 |
| `--mutate --class=App\Models` | 只對指定類別 |
| `--mutate --ignore=App\Http\Requests` | 忽略指定類別 |
| `--mutate --clear-cache` | 清除快取重新執行 |
| `--mutate --no-cache` | 不使用快取 |
| `--mutate --profile` | 顯示最慢的 10 個 mutation |
| `--mutate --retry` | 優先執行未測試的 mutation |
| `--mutate --stop-on-uncovered` | 遇到未覆蓋 mutation 就停止 |
| `--mutate --stop-on-untested` | 遇到未測試 mutation 就停止 |
| `--mutate --ignore-min-score-on-zero-mutations` | 無 mutation 時忽略最低分數要求 |

### 效能建議

Pest Mutation Testing 內建最佳化：
- 只執行覆蓋到變異程式碼的測試
- 盡量快取結果
- 支援 `--parallel` 平行執行
