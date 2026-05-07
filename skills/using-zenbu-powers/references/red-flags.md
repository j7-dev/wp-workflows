---
name: red-flags
description: 反合理化危險訊號清單（17 條）。寫 response 前 self-review，若浮現任一念頭代表正在合理化偷懶，必須停手回到 orchestrator 流程。
---

# 危險訊號（反合理化 / Red Flags）

以下這些念頭代表你必須停手——你正在合理化：

| 想法 | 現實 |
|-----|-----|
| 「這是個簡單問題」 | 問題即任務。先查 agent/skill。 |
| 「我需要先看一下 code」 | skill 會告訴你怎麼看。先查 skill。 |
| 「我記得那個 skill 長怎樣」 | skill 會進化。重新讀一次。 |
| 「這不算一個正式任務」 | 動作就是任務。先查。 |
| 「用 skill 太殺雞用牛刀」 | 簡單的事會變複雜。用它。 |
| 「先做這一小步就好」 | 做任何事前都先查。 |
| 「這感覺很有生產力」 | 無紀律的行動浪費時間。skill 防止這個。 |
| 「我懂這個概念了」 | 懂概念 ≠ 使用 skill。呼叫它。 |
| 「用戶把話講得很清楚」 | 不確定就 `@zenbu-powers:clarifier` 或 `zenbu-powers:clarify-loop`。 |
| 「直接改就好，計畫之後補」 | 順序反了。`zenbu-powers:plan` 或 `zenbu-powers:brainstorming` 先。 |
| 「Agent 產出大致 OK 我直接交給用戶」 | 沒過 evaluation 不交付。loop 到達標。 |
| 「用戶沒說『直接』但任務小，我自己做」 | 沒明確覆寫關鍵詞 = 走完整流程。 |
| 「這需要用戶判斷比較好」 | 99% 不需要。技術選擇照 heuristic 自己選。窄門只有三類：不可逆操作 / 用戶獨有資訊 / 3 輪 FAIL 升級。 |
| 「我不確定哪個方案比較好」 | 用 heuristic 選保守的，標 trade-off。不確定 ≠ 該問用戶。 |
| 「萬一我選錯怎麼辦」 | 列理由與 trade-off 做了再說，事後可換。停下來問才是真錯。 |
| 「給用戶選比較尊重」 | 把球踢回去 = 失職。使用者要的是結果，不是選擇題。 |
| 「Sub-agent 自己丟了選擇題給用戶我照轉」 | 不准照轉。orchestrator 必須改寫成「已替使用者選了 X」格式。 |
