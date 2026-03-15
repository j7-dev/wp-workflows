

額外開一個 worktree ， 分支名稱你幫我命名

呼叫 @"planner (agent)" 規劃分派任務

## 任務目標

參考 C:\Users\user\DEV\ASPNetCore\Visor\specs\list\README.md
進行 Batch 2 的開發 002, 006, 007, 008
specs\list\002-audit-log.spec.md
specs\list\006-video-enhance.spec.md
specs\list\007-polling.spec.md
specs\list\008-player-ab.spec.md

讓 Batch 2 所有功能都能順利開發完成，採用 **TDD 開發流程**
功能規格在 specs 目錄，請詳細閱讀

## 任務規劃
**skills 裡面有一系列 aibdd.auto. 開頭的所有 skill，看怎麼應用到 TDD 開發流程**

### 1. 釐清此次任務規格 - 先使用 /aibdd.discovery SKILL 跟用戶一起釐清此次任務規格

### 2. 先寫測試 - 針對這次的功能新增整合測試，使用 @"test-creator (agent)" agent 來完成

### 3. 開發功能 - 根據測試內容來開發功能，使用 @"wordpress-master (agent)" agent 來開發

### 4. 審核功能 - 開發完成後，使用 @"wordpress-reviewer (agent)" agent 來審核功能，確保功能正常，測試通過

### 5. 更新文件 - 功能審核通過後，更新相關文件，確保文件內容完整且符合規範

### 6. 使用 /git-commit 建立 commit，並且推送到遠端


## 驗收條件
1. **所有功能測試全數通過** 功能正常運行
2. 確保編譯通過，能正常運行

---
## 任務目標
使用生成此專案**所有功能**的整合測試 integration-test


## 注意事項
1. 如果需要 docker 環境請自行啟動，如果啟動不了可以請用戶協助

## 驗收條件，未達驗收標準不停止任務
1. **所有功能在不修改源代碼的情況下都能通過整合測試**
2. 需要生成整合測試的操作文檔/命令說明，確保其他開發者也能夠使用這些測試

## 測試環境
wordpress 登入網址: https://payuni-test.powerhouse.tw/wp-admin
帳號: test
密碼: test

https://payuni-test.powerhouse.tw 會映射到我本地的 http://test.local
可以使用 playwright 測試
開發完畢後我就關閉 server，不需要擔心密碼外洩與安全問題
開發方便為主