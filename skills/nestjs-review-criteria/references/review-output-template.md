# 審查報告輸出模板

## 完整報告結構

```markdown
# NestJS 程式碼審查報告

## 審查對象
- **PR / Branch**: {PR 連結或 branch 名稱}
- **變更範圍**: {N 個檔案，+XXX / -YYY 行}
- **主要涉及**: {例：orders feature 新增、auth guard 調整、Prisma 遷移}

## 前置檢查結果

| 項目               | 結果      | 備註                  |
| ------------------ | --------- | --------------------- |
| `tsc --noEmit`     | ✅ / ❌     | {若失敗，貼錯誤訊息}  |
| `eslint`           | ✅ / ❌     | {若失敗，列違規檔案}  |
| `prettier --check` | ✅ / ❌     |                       |
| `jest`（unit）     | ✅ / ❌     | {X passed / Y failed} |
| `jest --e2e`       | ✅ / ❌ / ⊘ | ⊘ 表示未配置          |
| `nest build`       | ✅ / ❌     |                       |

{若有任一 ❌ → 審查不通過，下方僅列需修復項目，不出正向反饋}

## 結論
{通過 / 不通過 / 退回修改} — {一句話總結}

---

## 問題清單

### 🔴 嚴重問題（阻擋合併）

#### 1. {問題標題}
- **位置**: `src/orders/orders.controller.ts:42`
- **類別**: {例：業務邏輯洩漏到 Controller}
- **描述**: {具體問題描述}

**Before**:
```typescript
// 貼出有問題的片段
```

**After**:
```typescript
// 建議的修改
```

**理由**: {為什麼這是問題、修改後的好處}

---

#### 2. {...}

### 🟠 重要問題（阻擋合併）

{同上格式}

### 🟡 建議改善（不阻擋合併）

{同上格式，可略簡}

### 🔵 備註（參考即可）

{可一句話帶過，不必貼程式碼}

---

## 優點

{至少列 1-3 個寫得好的地方，例如：}
- ✅ `OrdersService.create` 的 transaction 使用正確，避免 credit 扣除後訂單建立失敗的不一致
- ✅ 新增的 `InsufficientCreditException` 攜帶完整 context（required / actual），前端可直接顯示
- ✅ E2E 測試涵蓋 401 / 403 / 400 / 201 四種狀態碼

---

## Top 3 優先修改項目

若時間緊迫，優先處理這三項：

1. {最嚴重的 🔴 問題 #1}
2. {次嚴重的 🔴 問題 #2 或 🟠 問題 #1}
3. {第三個影響最大的問題}

---

## 後續建議（非本次必須）

- {例：Orders 模組之後若要支援退款，可考慮抽出 PaymentService}
- {例：Repository Pattern 已到位，可評估導入 Unit of Work}
```

---

## 審查結論訊息範本

### A. 審查通過（可合併）

```
✅ **審查通過**

共檢查 {N} 個檔案，變更 +{X} / -{Y} 行。

前置檢查：
- tsc ✅  eslint ✅  prettier ✅  jest ✅  build ✅

沒有發現 🔴 嚴重或 🟠 重要問題。
僅有 {M} 個 🟡 建議與 {K} 個 🔵 備註，不阻擋合併。

亮點：
- {一兩個寫得好的地方}

可合併。
```

---

### B. 審查不通過（退回 master 修改）

```
❌ **審查不通過**

共檢查 {N} 個檔案，變更 +{X} / -{Y} 行。

前置檢查：
- tsc ✅ / ❌  eslint ✅ / ❌  prettier ✅ / ❌  jest ✅ / ❌  build ✅ / ❌

發現問題：
- 🔴 嚴重：{N} 項（必須修復）
- 🟠 重要：{N} 項（必須修復）
- 🟡 建議：{N} 項
- 🔵 備註：{N} 項

**必須修復清單**：
1. [🔴] `src/orders/orders.controller.ts:42` — 業務邏輯洩漏到 Controller
2. [🔴] `src/users/users.service.ts:78` — 使用 `any` 型別
3. [🟠] `main.ts:15` — ValidationPipe 未設 `whitelist: true`
4. [🟠] `src/orders/orders.service.spec.ts` — 缺少 InsufficientCredit 錯誤路徑測試

詳細內容見完整報告。

請逐項修復後重新呼叫 reviewer。這是第 {N}/3 輪審查。
```

---

### C. 達到審查上限（請求人類介入）

```
⚠️ **審查迴圈達 3 輪上限，請求人類介入**

共檢查 {N} 個檔案。

三輪審查仍有以下未解決問題：
- 🔴 嚴重：{N} 項
- 🟠 重要：{N} 項

未解決清單：
1. [🔴] {問題 + 位置}
2. [🔴] {問題 + 位置}
...

各輪變動摘要：
- Round 1: {修了哪些，新增哪些}
- Round 2: {修了哪些，新增哪些}
- Round 3: {修了哪些，仍存在哪些}

建議由人類工程師決定：
- 是否放寬規則（如特殊業務邏輯確實需要）
- 是否拆分 PR（部分先合、部分後處理）
- 是否需要架構層級重新討論
```

---

### D. 前置檢查失敗（未進入審查）

```
❌ **審查中斷：前置檢查失敗**

前置檢查結果：
- tsc: ❌ {貼前 5 個錯誤}
- eslint: ⊘ 未執行（tsc 失敗先止血）

請先修復型別錯誤讓 `pnpm tsc --noEmit` 通過，再呼叫 reviewer。

{若為工具不可用：}
⚠️ 無法執行 `pnpm test`：找不到 jest 設定。
請確認 `package.json` 的 scripts 與 `jest.config.ts` 存在。
```

---

## 問題描述的「好壞」對比

### ❌ 不合格的問題描述

> 「Controller 有點肥大，建議重構一下。」

問題：
- 沒位置（哪個 Controller？哪行？）
- 沒類別（什麼叫肥大？業務邏輯？方法數量？）
- 沒嚴重性
- 沒 before/after
- 沒理由

### ✅ 合格的問題描述

> **[🔴 嚴重] 業務邏輯洩漏到 Controller**
>
> - **位置**: `src/orders/orders.controller.ts:42-58`
> - **問題**: `create` 方法直接組裝 Order、查詢 User credit、發信，違反 Controller 薄層原則
>
> **Before**:
> ```typescript
> @Post()
> async create(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
>   if (user.credit < dto.total) throw new ForbiddenException('...');
>   const order = await this.ordersRepo.save({...});
>   await this.mailer.send({...});
>   return order;
> }
> ```
>
> **After**:
> ```typescript
> @Post()
> create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: number) {
>   return this.ordersService.create(userId, dto);
> }
> ```
>
> **理由**: Controller 應只負責 HTTP 協定層，業務邏輯放 Service 才能被其他入口（CLI、MQ handler、測試）復用，也便於單元測試。

---

## Reviewer 對 Master 的 SendMessage 範本

```
@zenbu-powers:nestjs-master

請修復以下問題後重新呼叫審查（當前第 {N}/3 輪）：

**必須修復（🔴 嚴重 + 🟠 重要）**
1. src/orders/orders.controller.ts:42 — 業務邏輯洩漏（把 create 的內部邏輯搬到 OrdersService.create）
2. src/users/users.service.ts:78 — 使用 any 型別（改為 CreateUserDto）
3. main.ts:15 — ValidationPipe 未設 whitelist（加 whitelist + forbidNonWhitelisted + transform）
4. src/orders/orders.service.spec.ts — 缺 InsufficientCredit 錯誤路徑測試

**前置檢查失敗項**
- jest: 1 test failing（OrdersService.create should throw when credit insufficient）
- 需補完該測試並確保綠燈

**建議（可先不處理但後續處理）**
- 🟡 `calculateTotal` 可 extract 到獨立方法提升可讀性

完整報告見 {附上完整 markdown 或引用位置}

修復完成後請重新跑 Quality Gate 並呼叫 `@zenbu-powers:nestjs-reviewer`。
```
