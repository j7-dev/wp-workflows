---
name: nodejs-master
description: Node.js 20+ / TypeScript 5+ 後端開發標準與最佳實踐。涵蓋 9 條核心開發規則、分層架構範例、命名規範、測試撰寫規範、除錯技巧。供 nodejs-master agent 開發時嚴格遵守。
enable_by_default: true
---

# Node.js / TypeScript 後端編碼標準

本 Skill 定義 Node.js 後端開發的完整規範，包含開發規則、代碼風格、架構模式、測試與除錯。

## 技術棧

- **核心**：Node.js 20+、TypeScript 5+
- **框架**：Express（傳統）/ Fastify（高效能）/ NestJS（大型專案）/ Hono（邊緣運算）
- **ORM**：Prisma（優先）
- **驗證**：Zod（Schema 驗證 + 型別推導）
- **測試**：Vitest（單元測試）+ Supertest（整合測試）
- **日誌**：pino（結構化日誌）
- **佇列**：BullMQ（Job Queue）
- **建構**：tsup（TypeScript 打包）
- **工具**：dotenv-safe、helmet、cors、compression

## 參考文件

- [開發規則](references/dev-rules.md) — 9 條核心規則（strict mode、Zod 驗證、Repository Pattern、DI 等）
- [架構與代碼風格](references/architecture.md) — 分層架構範例、Prisma Schema、pino 日誌、BullMQ
- [測試與驗證](references/testing.md) — 測試撰寫規範、驗證步驟、交付前檢查清單
- [除錯技巧](references/debugging.md) — pino 結構化日誌分析、Prisma Query Log、TypeScript 型別工具
