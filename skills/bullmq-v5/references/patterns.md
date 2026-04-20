# BullMQ 進階 Patterns

## Idempotent Jobs（冪等任務）

使用業務唯一 key 作為 `jobId`，防止重複新增：

```typescript
await queue.add(
  'send-email',
  { userId, templateId },
  { jobId: `email:${userId}:${templateId}:${dayStr}` },
);
```

同 `jobId` 若已存在於 queue 內（或已完成但 `removeOnComplete: false`），新 add 會被忽略。

## Deduplication（TTL 去重）

```typescript
await queue.add(
  'sync',
  { resourceId },
  {
    deduplication: { id: `sync:${resourceId}`, ttl: 60000 },
  },
);
```

TTL 內同 id 只保留一個 job。

## Debounce（延遲合併）

```typescript
await queue.add(
  'update-cache',
  { key },
  {
    debounce: { id: `cache:${key}`, ttl: 5000 },
  },
);
```

5 秒內重複 add 同 id，只保留最後一次。

## Priority（優先序）

```typescript
// 越小越優先（1 = 最高）
await queue.add('urgent', data, { priority: 1 });
await queue.add('normal', data, { priority: 10 });
await queue.add('low', data, { priority: 100 });
```

## Delayed + 精確排程

```typescript
// 5 秒後
await queue.add('task', data, { delay: 5000 });

// 特定時間
const when = new Date('2026-05-01T00:00:00Z').getTime();
await queue.add('task', data, { delay: when - Date.now() });
```

## Long-running jobs（延長鎖）

```typescript
const worker = new Worker('q', async (job, token) => {
  const interval = setInterval(() => job.extendLock(token!, 30000), 15000);
  try {
    await longWork();
  } finally {
    clearInterval(interval);
  }
}, { connection, lockDuration: 30000 });
```

或提高 `lockDuration` 到合理值（不超過 Redis `visibility timeout`）。

## Graceful Shutdown

```typescript
async function shutdown() {
  console.log('Shutting down...');
  await worker.close();     // 等待 active jobs 完成
  await queue.close();
  await queueEvents.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## Manual Job Fetch（不用 processor，手動取）

```typescript
const worker = new Worker('q', null!, { connection });
// 或 autorun: false 搭配...

const token = uuid();
const job = await queue.getNextJob(token);
if (job) {
  try {
    await process(job);
    await job.moveToCompleted(result, token);
  } catch (e) {
    await job.moveToFailed(e, token);
  }
}
```

## Stop Retry on Specific Error

```typescript
import { UnrecoverableError } from 'bullmq';

const worker = new Worker('q', async (job) => {
  try {
    await work(job.data);
  } catch (e) {
    if (e.code === 'INVALID_INPUT') {
      throw new UnrecoverableError(e.message);  // 不重試
    }
    throw e;  // 其他錯依 attempts + backoff 重試
  }
}, { connection });
```

## Timeout Jobs（Worker 層）

BullMQ 5 沒有內建 per-job timeout，但可自己實作：

```typescript
const worker = new Worker('q', async (job) => {
  const result = await Promise.race([
    doWork(job),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 30000)),
  ]);
  return result;
}, { connection });
```

## Progress Reporting

```typescript
await job.updateProgress(25);                    // number
await job.updateProgress({ percent: 50, step: 'upload' });  // object

worker.on('progress', (job, progress) => {
  console.log(`Job ${job.id}: ${JSON.stringify(progress)}`);
});
```

## Flow 子任務失敗行為

```typescript
await flow.add({
  name: 'parent',
  queueName: 'q',
  children: [
    {
      name: 'critical-child',
      queueName: 'q',
      opts: { failParentOnFailure: true },       // 此子失敗 → parent 失敗
    },
    {
      name: 'optional-child',
      queueName: 'q',
      opts: { ignoreDependencyOnFailure: true }, // 此子失敗 → parent 仍執行
    },
    {
      name: 'continue-child',
      queueName: 'q',
      opts: { continueParentOnFailure: true },   // 此子失敗 → parent 照常跑，但計為 failed
    },
  ],
});
```

## Scheduled Jobs（每日、每小時）

```typescript
// 每天 03:00（台北時區）
await queue.upsertJobScheduler(
  'daily-cleanup',
  { pattern: '0 3 * * *', tz: 'Asia/Taipei' },
  { name: 'cleanup', data: {} },
);

// 每 15 分鐘
await queue.upsertJobScheduler('poll', { every: 15 * 60 * 1000 });

// 工作日 09:00
await queue.upsertJobScheduler(
  'workday',
  { pattern: '0 9 * * MON-FRI', tz: 'Asia/Taipei' },
  { name: 'workday-job' },
);
```

## 監控 Metrics

```typescript
// Worker 內建 metrics
const worker = new Worker('q', processor, {
  connection,
  metrics: { maxDataPoints: 24 * 60 },  // 24 小時 × 60 分鐘
});

// 查詢
const completed = await queue.getMetrics('completed', 0, 60);
const failed = await queue.getMetrics('failed', 0, 60);
// { data: [counts per minute], count, meta: { count, prevTS, prevCount } }
```

Prometheus exporter 可用 [`bullmq-prometheus-exporter`](https://www.npmjs.com/package/bullmq-prometheus-exporter)。

## 跨 Queue Flow

FlowProducer 可在不同 queue 間建立依賴：

```typescript
await flow.add({
  name: 'email-campaign',
  queueName: 'campaigns',
  children: [
    { name: 'render-template', queueName: 'renderers' },
    { name: 'send-emails', queueName: 'senders' },
  ],
});
```

每個 queue 各自有 worker。

## Rate limiter by key

```typescript
// 針對特定 key 限流（例如 per-user）
await queue.add('api-call', { userId: 'u1' }, {
  rateLimiterKey: 'user-u1',
});

// Worker 限流邏輯由 BullMQ 處理
```

## 手動重試邏輯

```typescript
const job = await queue.getJob(jobId);
await job.retry('failed');   // 'failed' 或 'completed'
```

## 測試 Worker（Jest）

```typescript
import IORedis from 'ioredis-mock';

describe('Worker', () => {
  let connection: any;
  let queue: Queue;

  beforeEach(() => {
    connection = new IORedis();
    queue = new Queue('test', { connection });
  });

  afterEach(async () => {
    await queue.obliterate({ force: true });
    await queue.close();
  });

  it('processes jobs', async () => {
    const processed: any[] = [];
    const worker = new Worker('test', async (job) => {
      processed.push(job.data);
    }, { connection });

    await queue.add('a', { v: 1 });

    await new Promise((resolve) =>
      worker.on('completed', () => resolve(undefined))
    );

    expect(processed).toEqual([{ v: 1 }]);
    await worker.close();
  });
});
```

**注意**：`ioredis-mock` 對 Stream commands 支援有限，進階測試建議跑真實 Redis（Testcontainers）。
