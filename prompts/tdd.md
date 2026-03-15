

額外開一個 worktree ， 分支名稱你幫我命名

呼叫 @agents/planner.agent-leader.md 規劃分派任務

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

### 2. 先寫測試 - 針對這次的 HOPS 功能新增整合測試，使用 @agents/test-creator.agent.md agent 來完成

### 3. 開發功能 - 根據測試內容來開發功能，使用 @agents/avalonia-master.agent.md , @agents/abp-master.agent.md agent 來開發

### 4. 審核功能 - 開發完成後，使用 @agents/avalonia-reviewer.agent.md , @agents/abp-reviewer.agent.md agent 來審核功能，確保功能正常，測試通過

### 5. 更新文件 - 功能審核通過後，更新相關文件，確保文件內容完整且符合規範

### 6. 使用 /git-commit 建立 commit，並且推送到遠端


## 驗收條件
1. **所有功能測試全數通過** 功能正常運行
2. 確保編譯通過，能正常運行