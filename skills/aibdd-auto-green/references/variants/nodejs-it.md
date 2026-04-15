# Green Variant: nodejs-it

## 測試命令

```bash
# 開發階段：執行特定 Feature 檔案（快速迭代）
npx cucumber-js ${NODE_TEST_FEATURES_DIR}/01-增加影片進度.feature

# 開發階段：執行特定 Scenario（最快）
npx cucumber-js ${NODE_TEST_FEATURES_DIR}/01-增加影片進度.feature --name "成功增加影片進度"

# 完成階段：執行所有已完成紅燈的測試（總回歸測試）
npx cucumber-js --tags "not @ignore"
```

**為什麼使用 `--tags "not @ignore"`？**
- 只執行已完成紅燈實作的 features（已移除 `@ignore` 標籤）
- 避免執行尚未實作的 features 造成混淆
- 確保回歸測試的範圍清晰明確

## 實作模式

### 實作目標

Zod Schemas → Services → Express Routes → Route 註冊

### 實作順序

根據測試錯誤訊息逐步實作：

1. 執行測試 → `npx cucumber-js ${NODE_TEST_FEATURES_DIR}/xxx.feature`
2. 看錯誤訊息（HTTP 404? 500? 400?）
3. 根據錯誤補充最少的程式碼（schemas → services → routes → 註冊路由）
4. 再次執行測試
5. 循環直到特定測試通過
6. 執行總回歸測試 → `npx cucumber-js --tags "not @ignore"`

### 最小增量範例

```typescript
// 做太多了（測試沒要求）
router.post('/lesson-progress/update-video-progress', jwtAuth, async (req, res) => {
  validateInventory();        // 沒測試
  sendEmailNotification();    // 沒測試
  logAuditTrail();           // 沒測試
  const result = await service.updateProgress(req.body);
  res.json(result);
});

// 剛好夠（只實作測試要求的）
router.post('/lesson-progress/update-video-progress', jwtAuth, async (req, res) => {
  const result = await service.updateProgress(req.body);
  res.json(result);
});
```

## 框架 API

### Express Route 建立

```typescript
// ${NODE_ROUTES_DIR}/lesson-progress.ts
import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { jwtAuth, AuthRequest } from '../middleware/jwt-auth';
import { LessonProgressService } from '../services/lesson-progress-service';
import { LessonProgressRepository } from '../repositories/lesson-progress-repository';

export function lessonProgressRoutes(db: NodePgDatabase): Router {
  const router = Router();
  const repository = new LessonProgressRepository(db);
  const service = new LessonProgressService(repository);

  router.post('/lesson-progress/update-video-progress', jwtAuth, async (req: AuthRequest, res, next) => {
    try {
      const result = await service.updateVideoProgress(req.userId!, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
```

### 路由註冊

```typescript
// ${NODE_ROUTES_DIR}/index.ts
import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { lessonProgressRoutes } from './lesson-progress';

export function routes(db: NodePgDatabase): Router {
  const router = Router();
  router.use(lessonProgressRoutes(db));
  return router;
}
```

### 檔案建立順序

```
步驟 1: 建立 schemas（如果需要）
→ ${NODE_SCHEMAS_DIR}/lesson-progress.ts
→ 定義 Zod validation schemas

步驟 2: 建立 services
→ ${NODE_SERVICES_DIR}/lesson-progress-service.ts
→ 實作業務邏輯

步驟 3: 建立 routes
→ ${NODE_ROUTES_DIR}/lesson-progress.ts
→ 定義路由和 HTTP 處理

步驟 4: 在 routes/index.ts 中註冊路由
→ ${NODE_ROUTES_DIR}/index.ts
→ 將 route 加入 Express router
```

## 常見錯誤修復

### HTTP 404 Not Found
**原因**：API Endpoint 不存在
**修復**：
1. 在 `${NODE_ROUTES_DIR}/` 中建立 route
2. 在 `${NODE_ROUTES_DIR}/index.ts` 中註冊 route

### HTTP 500 Internal Server Error
**原因**：後端程式碼有錯誤
**修復**：
1. 檢查錯誤訊息
2. 修正 Service/Repository 的邏輯

### HTTP 400 Bad Request
**原因**：業務規則驗證失敗
**修復**：
1. 確認業務規則正確實作
2. 調整 Zod schema 或驗證邏輯

### HTTP 401 Unauthorized
**原因**：JWT Token 驗證失敗
**修復**：
1. 確認 `${NODE_MIDDLEWARE_DIR}/jwt-auth.ts` 中的驗證邏輯正確
2. 確認 JWT 密鑰與測試用的 JwtHelper 一致

## 迭代策略

### 開發循環（快速迭代）

```
1. 執行特定測試 → npx cucumber-js ${NODE_TEST_FEATURES_DIR}/xxx.feature
2. 看錯誤訊息 → 理解失敗原因
3. 寫最少的程式碼修正這個錯誤
4. 再次執行特定測試
5. 還有錯誤？回到步驟 2
6. 特定測試通過？進入完成驗證
```

### 完成驗證（回歸測試）

```
7. 執行所有已完成紅燈的測試 → npx cucumber-js --tags "not @ignore"
8. 所有測試通過？完成綠燈！
9. 有測試失敗？回到步驟 2，修復破壞的測試
```

## Docker / 環境

### 執行前確認

```bash
# 1. 確認 Docker Desktop 是否在運行
docker ps

# 2. 確認 Docker Daemon 正常響應
docker info
```

### 常見錯誤訊息與解法

| 錯誤訊息 | 原因 | 解法 |
|---------|------|------|
| `Could not find a working container runtime strategy` | Docker Desktop 未啟動 | 啟動 Docker Desktop |
| `Error response from daemon: pull access denied` | 無法下載 PostgreSQL image | 確認網路連線，或執行 `docker pull postgres:16` |
| `ECONNREFUSED 127.0.0.1:5432` | Testcontainers 初始化失敗 | 確認 Docker Desktop 已啟動，重新執行測試 |

### 完成條件

- [ ] 執行特定測試 `npx cucumber-js ${NODE_TEST_FEATURES_DIR}/xxx.feature` 通過
- [ ] 執行總回歸測試 `npx cucumber-js --tags "not @ignore"` 所有測試通過
- [ ] 沒有破壞既有功能
- [ ] 程式碼簡單直接
- [ ] 未引入任何測試未要求的功能
