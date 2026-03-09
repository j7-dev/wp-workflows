# 效能優化
> 來源：https://pestphp.com/docs/optimizing-tests
> 最後更新：2026-02-23

---

## 平行測試（Parallel Testing）

使用 `--parallel` 同時在多個程序執行測試：

```bash
./vendor/bin/pest --parallel
```

指定程序數：

```bash
./vendor/bin/pest --parallel --processes=10
```

> **Windows 使用者：** 請使用 WSL terminal。

### 注意事項

1. **資料庫資源不共享** — 每個測試應獨立，不依賴共享資源
2. **執行順序不保證** — 測試不應依賴特定順序
3. **注意 Race Conditions** — 多程序存取共享資源可能發生競爭條件

---

## 效能分析（Profiling）

找出執行最慢的測試：

```bash
./vendor/bin/pest --profile
```

輸出前 10 個最慢的測試，協助識別需要優化的部分。

---

## 精簡輸出（Compact Printer）

只顯示失敗的測試（減少 I/O，稍微加快速度）：

```bash
./vendor/bin/pest --compact
```

設定為預設（在 `tests/Pest.php` 中）：

```php
// tests/Pest.php
pest()->printer()->compact();
```

---

## 快速參考

| 技術 | 指令 | 效果 |
|------|------|------|
| 平行測試 | `--parallel` | 大幅縮短執行時間 |
| 指定程序數 | `--parallel --processes=10` | 自訂平行程度 |
| 效能分析 | `--profile` | 找出慢速測試 |
| 精簡輸出 | `--compact` | 只顯示失敗，減少輸出 |
| 只執行失敗的 | `--retry` | 優先執行之前失敗的測試 |
| 只執行變更的 | `--dirty` | 只執行有未提交變更的測試 |
