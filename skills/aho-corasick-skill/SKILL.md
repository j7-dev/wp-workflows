---
name: aho-corasick
description: >
  Multi-pattern text search, filtering, and replacement using the Aho-Corasick algorithm.
  Use this skill whenever the user wants to: search for multiple keywords/patterns simultaneously
  in text or files, filter or detect sensitive words, scan multiple files for a list of terms,
  or redact/replace matched content. Triggers on phrases like "掃描關鍵字", "敏感詞過濾",
  "多個 pattern 搜尋", "批次掃描", "redact", "replace patterns", "keyword filter",
  "find multiple words", "scan files for patterns", or any task involving simultaneous
  multi-pattern matching. Always prefer this skill over naive grep loops when more than
  one pattern is involved.
---

# Aho-Corasick Skill

高效能多 pattern 同時比對，適合關鍵字過濾、敏感詞偵測、文件掃描與 redact。

## 依賴安裝

```bash
pip install ahocorasick-rs --break-system-packages
```

環境若已安裝可跳過。

## 四種核心功能

| 功能 | 說明 | 對應 script |
|------|------|-------------|
| **search** | 在文字/檔案中找出所有 pattern 的出現位置 | `scripts/ac_search.py` |
| **filter** | 判斷文字是否包含任何 pattern（回傳 True/False + 命中清單）| `scripts/ac_filter.py` |
| **scan** | 批次掃描多個檔案，回傳每個檔案的命中結果 | `scripts/ac_scan.py` |
| **redact** | 將命中的 pattern 替換成指定字串（預設 `***`）| `scripts/ac_redact.py` |

## 使用方式

### 1. Search — 找出所有命中位置

```bash
# 從文字輸入
python scripts/ac_search.py --patterns "apple,banana,cherry" --text "I like apple pie and banana bread"

# 從檔案讀取 patterns（每行一個）
python scripts/ac_search.py --patterns-file patterns.txt --text "some text here"

# 搜尋檔案內容
python scripts/ac_search.py --patterns "error,warning,critical" --file /var/log/app.log
```

輸出範例：
```json
{
  "matches": [
    {"pattern": "apple", "start": 7, "end": 12},
    {"pattern": "banana", "start": 21, "end": 27}
  ],
  "total": 2
}
```

### 2. Filter — 敏感詞/關鍵字過濾

```bash
python scripts/ac_filter.py --patterns-file blocklist.txt --text "This contains badword here"
```

輸出範例：
```json
{
  "flagged": true,
  "matched_patterns": ["badword"],
  "count": 1
}
```

### 3. Scan — 批次掃描多個檔案

```bash
# 掃描目錄下所有 .txt 檔
python scripts/ac_scan.py --patterns-file keywords.txt --dir ./docs --ext .txt

# 掃描指定多個檔案
python scripts/ac_scan.py --patterns "TODO,FIXME,HACK" --files file1.py file2.py file3.py
```

輸出範例：
```json
{
  "summary": {"files_scanned": 3, "files_with_matches": 2, "total_matches": 7},
  "results": [
    {"file": "file1.py", "matches": [{"pattern": "TODO", "line": 12, "context": "# TODO: fix this"}]},
    {"file": "file2.py", "matches": []},
    {"file": "file3.py", "matches": [{"pattern": "FIXME", "line": 5, "context": "# FIXME broken"}]}
  ]
}
```

### 4. Redact — 替換/遮蔽命中內容

```bash
# 預設替換成 ***
python scripts/ac_redact.py --patterns "John,secret,password" --text "John knows the secret password"

# 自訂替換字串
python scripts/ac_redact.py --patterns-file pii.txt --text "Call John at 0912-345-678" --replacement "[REDACTED]"

# 替換檔案內容並輸出
python scripts/ac_redact.py --patterns-file pii.txt --file input.txt --output redacted.txt
```

輸出範例：
```json
{
  "redacted_text": "*** knows the *** ***",
  "replacements_made": 3
}
```

## 在 Python 中直接呼叫

Claude 也可以直接在 code execution 中使用，不需要走 CLI：

```python
import subprocess, json

result = subprocess.run(
    ["python", "scripts/ac_search.py", "--patterns", "error,warning", "--text", log_text],
    capture_output=True, text=True
)
data = json.loads(result.stdout)
```

或直接 import：

```python
import ahocorasick_rs

ac = ahocorasick_rs.AhoCorasick(["apple", "banana", "cherry"])
matches = ac.find_matches_as_indexes("I like apple and banana")
# [(0, 7, 12), (1, 17, 23)]  → (pattern_index, start, end)
```

## 注意事項

- **大小寫**：預設區分大小寫。如需 case-insensitive，在 patterns 前處理（如全轉小寫）並對 haystack 同步處理。
- **空 pattern**：`ahocorasick_rs` 不支援空字串 pattern，會拋 `ValueError`，script 已做防護。
- **大檔案**：scan 模式對每個檔案逐行處理，避免一次載入超大檔案進記憶體。
- **Overlapping**：若需要找出重疊的命中（例如 pattern "ab" 和 "abc" 在同一位置），加上 `--overlapping` flag。
