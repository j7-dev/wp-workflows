---
name: nestjs-review-criteria
description: NestJS 10+ / TypeScript 程式碼審查 checklist，專精模組邊界、Dependency Injection、Guards/Interceptors/Pipes/Filters、TypeORM/Prisma Repository Pattern、class-validator DTO、JWT/Passport 認證與 Jest 測試覆蓋檢查。提供可逐項勾選的審查清單、嚴重性分級、before/after 對比範例與輸出報告模板，供 @zenbu-powers:nestjs-reviewer 審查時照表操作。與 @zenbu-powers:nestjs-coding-standards 搭配：該 skill 寫「規範本身」，本 skill 寫「審查時照著跑的 checklist」。
---

# NestJS 10+ 程式碼審查 Checklist

專供程式碼審查流程使用的結構化 checklist 與輸出模板。與 `@zenbu-powers:nestjs-coding-standards` 的分工：

| Skill | 定位 |
|-------|------|
| `nestjs-coding-standards` | 規範本身（命名、DI、分層、範例） |
| `nestjs-review-criteria`（本技能） | 審查時照著勾選的 checklist + 嚴重性等級 + 輸出模板 |

---

## 適用時機

- `nestjs-reviewer` agent 執行 PR / MR 審查時
- 開發者自審 NestJS / TypeScript 程式碼
- 需要產出結構化審查報告（含嚴重性等級、位置、建議修改）
- 需查詢 NestJS 專項檢查（Module 邊界、DI、Guard/Pipe/Interceptor/Filter 職責）

---

## 審查嚴重性等級

| 等級 | 符號 | 說明 | 合併建議 |
|------|------|------|---------|
| 嚴重 | 🔴 | 型別安全漏洞、DI 失敗、記憶體洩漏、安全問題、會導致 runtime bug 的邏輯錯誤 | **阻擋合併** |
| 重要 | 🟠 | 違反核心規則、影響可維護性或效能、測試缺失、Module 邊界錯亂 | **阻擋合併** |
| 建議 | 🟡 | 命名不一致、可讀性、可優化之處 | 可合併，建議後續處理 |
| 備註 | 🔵 | 風格偏好、未來可考慮的優化方向 | 可合併 |

---

## 審查前置檢查（強制）

即使開發者聲稱已通過測試，reviewer 仍須獨立驗證：

```bash
# 取得變更範圍
git diff -- '*.ts'

# 強制跑過的測試項（任一失敗即審查不通過）
pnpm tsc --noEmit
pnpm lint
pnpm format:check
pnpm test              # 單元 + 整合
pnpm test:e2e          # E2E（若已配置）
pnpm build             # Nest build
```

若指令不存在，報告中註明「該工具未配置」即可，已配置的工具必須全部執行。任何失敗直接判定審查不通過。

---

## 十一大審查類別（索引）

依主題拆分到 references：

| # | 類別 | 參考檔 |
|---|------|--------|
| 一 | TypeScript 型別安全（禁 any、unknown 處理） | `references/typescript-strict.md` |
| 二 | 安全性（認證、授權、secret 管理、輸入驗證） | `references/security-checks.md` |
| 三 | Module 邊界與依賴健康度（circular、forwardRef、Global 濫用） | `references/module-and-di.md` |
| 四 | Dependency Injection 正確性（@Injectable、scope、new） | `references/module-and-di.md` |
| 五 | Controller 薄層（業務邏輯洩漏） | `references/layered-architecture-checks.md` |
| 六 | Service / Repository 分層 | `references/layered-architecture-checks.md` |
| 七 | DTO + ValidationPipe（class-validator / Zod） | `references/dto-validation-checks.md` |
| 八 | Guards / Interceptors / Pipes / Filters 職責正確 | `references/interceptor-guard-pipe-filter-checks.md` |
| 九 | 例外處理（HttpException 體系、敏感資訊洩漏） | `references/error-handling-checks.md` |
| 十 | 測試覆蓋（unit / integration / e2e） | `references/testing-coverage-checks.md` |
| 十一 | 命名與結構（檔名、類別、目錄） | `references/naming-and-structure-checks.md` |

---

## NestJS 專項重點

| 重點 | 檢查項 | 參考檔 |
|------|--------|--------|
| **Module 邊界** | `AppModule` 是否肥大？`imports`/`exports` 是否精準？有無不必要 `forwardRef()`？ | `references/module-and-di.md` |
| **Provider 作用域** | 是否誤用 `REQUEST` scope 導致效能退化？`@Global()` 是否濫用？ | `references/module-and-di.md` |
| **DI 正確性** | 有無 `new` 手動建構依賴？有無漏打 `@Injectable()`？ | `references/module-and-di.md` |
| **DTO 驗證** | 所有輸入是否經 DTO？巢狀物件是否加 `@Type()`？`ValidationPipe` 全域？ | `references/dto-validation-checks.md` |
| **Guard/Pipe/Interceptor/Filter** | 職責是否混淆（如拿 Interceptor 做權限）？Filter 順序是否正確？ | `references/interceptor-guard-pipe-filter-checks.md` |
| **例外處理** | 有無拋 raw `Error`？是否洩漏 stack trace 到 production？ | `references/error-handling-checks.md` |
| **設定管理** | 有無直接讀 `process.env`？`ConfigService` 是否型別化？ | `references/security-checks.md` |
| **Repository Pattern** | 有無 Service 直接呼叫 `dataSource.query()` 或 `prisma.xxx`？ | `references/layered-architecture-checks.md` |
| **測試覆蓋** | Controller / Service / Guard / Pipe 是否都有單元測試？關鍵流程是否有 e2e？ | `references/testing-coverage-checks.md` |

---

## 審查報告輸出格式

參見 `references/review-output-template.md`，內含：

- 審查摘要區塊模板
- 問題清單分類呈現（🔴 / 🟠 / 🟡 / 🔵）
- 優點與 Top 3 優先修改項目
- 審查結論訊息範本（通過 / 不通過 / 退回開發者）

---

## 使用方式

1. 先讀本 SKILL.md 取得全貌與嚴重性等級
2. 跑完前置檢查（tsc / lint / test / build），任一失敗即判不通過
3. 依 PR 涉及範疇載入對應 references/*.md
4. 按 checklist 逐項勾選，記下位置（檔:行）、類別、嚴重性
5. 依 `review-output-template.md` 組裝最終報告
