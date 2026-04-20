---
name: nestjs-coding-standards
description: NestJS 10+ / TypeScript 5+ 編碼標準與最佳實踐，涵蓋模組化架構、Dependency Injection、Controller/Service/Repository 分層、DTO + class-validator、Guards/Interceptors/Pipes/Filters、TypeORM/Prisma Repository Pattern、JWT/Passport 認證、Jest + supertest 測試規範與命名慣例。供 @zenbu-powers:nestjs-master 開發時遵循，並作為 @zenbu-powers:nestjs-reviewer 的判準。當開發或審查 NestJS 程式碼、建立新 Module、重構後端、或確認命名與型別慣例時請啟用此技能。
---

# NestJS 10+ 編碼標準

NestJS 後端開發的統一編碼規範。與 `@zenbu-powers:nestjs-master` 開發 agent、`@zenbu-powers:nestjs-reviewer` 審查 agent 配合使用。

## 適用時機

- 開始新 Module / Controller / Service 開發
- 重構既有程式碼以符合 NestJS 慣例
- 審查 PR 時對照規範（搭配 `@zenbu-powers:nestjs-review-criteria`）
- 新成員熟悉專案編碼慣例
- 確立命名、DI、分層、錯誤處理的一致性

---

## 程式碼品質原則

1. **可讀性優先**：清楚的命名、自我說明的程式碼
2. **KISS**：找到最簡單的可行解，避免過度設計
3. **DRY**：共用邏輯抽成 Service / Utility / Pipe
4. **YAGNI**：不做當前需求不需要的抽象
5. **SRP**：一個 Module / Class / Method 只做一件事
6. **SOLID**：NestJS 的 DI 容器是 SOLID 原則的天然載體，好好利用

---

## 核心技術棧

| 類別 | 標準選擇 | 備註 |
|------|---------|------|
| 核心框架 | NestJS 10+ | Express 或 Fastify 適配器 |
| 語言 | TypeScript 5+ | `strict: true` |
| Runtime | Node.js 20+ | LTS 版本 |
| ORM | TypeORM / Prisma / Mongoose | 依專案選一 |
| 驗證 | class-validator + class-transformer | 官方標配 |
| 替代驗證 | `nestjs-zod`（若專案使用 Zod） | |
| 認證 | `@nestjs/passport` + `@nestjs/jwt` | Passport strategies |
| 設定 | `@nestjs/config` | 禁止直讀 `process.env` |
| API 文件 | `@nestjs/swagger` | OpenAPI 自動生成 |
| 佇列 | `@nestjs/bullmq` | Redis backend |
| 快取 | `@nestjs/cache-manager` | |
| Microservices | `@nestjs/microservices` | Kafka / RabbitMQ / Redis / gRPC |
| 測試 | Jest + `@nestjs/testing` + supertest | 官方 |

---

## 9 條核心開發規則（速查）

完整範例與反例見 `references/core-rules.md`：

1. **Strict Mode**：`tsconfig.json` 啟用 `strict: true`，禁止 `any`
2. **DTO 驗證**：所有外部輸入（body / query / param）使用 DTO + `class-validator`（或 Zod）
3. **Module 單一職責**：依 feature 切分，禁止神級 `AppModule`，`imports`/`exports` 精準
4. **Controller 薄層**：只做接收請求、呼叫 Service、回應，業務邏輯一律放 Service
5. **Service 注入 Repository**：`@Injectable()` + 建構子注入，禁止 `new`
6. **Repository Pattern**：資料存取封裝於 Repository（TypeORM 用 `Repository<Entity>`，Prisma 用 service wrapper）
7. **全域 Pipe + Filter**：`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` + 自訂 `HttpExceptionFilter`
8. **認證授權**：`@UseGuards(JwtAuthGuard, RolesGuard)` + 自訂 `@Roles()` 裝飾器
9. **自訂例外**：繼承 `HttpException`（如 `ResourceNotFoundException extends NotFoundException`），禁止拋 raw `Error`

---

## 參考文件索引

依任務類型載入對應 references：

| 主題 | 參考檔 | 何時載入 |
|------|--------|---------|
| 9 條規則詳細展開 + 程式碼範例 | `references/core-rules.md` | 開始開發前通讀一次 |
| Module / DI / Provider scope | `references/architecture.md` | 建立新 Module、處理跨模組依賴 |
| Controller / Service / Repository 分層 | `references/layered-architecture.md` | 實作新功能、重構既有邏輯 |
| DTO + class-validator + Zod | `references/dto-and-validation.md` | 設計 API 輸入驗證 |
| Guards / Interceptors / Pipes / Filters | `references/guards-interceptors-pipes-filters.md` | 實作認證授權、請求/回應轉換 |
| 例外處理與 HttpException 體系 | `references/error-handling.md` | 設計錯誤回應 |
| Jest + TestingModule + supertest | `references/testing.md` | 撰寫單元 / 整合 / E2E 測試 |
| 命名與目錄結構 | `references/naming-and-structure.md` | 新增檔案、重構命名 |
| 設定管理（ConfigService） | `references/configuration.md` | 處理環境變數、多環境設定 |

---

## Quality Gate（交付前必跑）

```bash
pnpm tsc --noEmit      # 型別檢查
pnpm lint              # ESLint
pnpm format:check      # Prettier
pnpm test              # Jest 單元測試
pnpm test:e2e          # supertest E2E
pnpm build             # Nest build
```

任一失敗即中斷交付流程，先修復再重跑。
