---
name: bullmq-v5
description: >
  BullMQ v5 完整技術參考，對應 bullmq ^5.x。
  當程式碼出現任何以下情況時，必須使用此 skill：
  import from 'bullmq'、import from '@nestjs/bullmq'、import IORedis from 'ioredis'（與 BullMQ 搭配）；
  new Queue、new Worker、new QueueEvents、new FlowProducer、new Job；
  queue.add、queue.addBulk、queue.upsertJobScheduler、queue.removeJobScheduler、
  queue.getJob、queue.getJobs、queue.getJobCounts、queue.pause、queue.resume、queue.clean、queue.obliterate、
  worker.run、worker.close、worker.pause、worker.resume、worker.rateLimit；
  job.updateProgress、job.log、job.updateData、job.getState、job.remove、job.retry、
  job.isCompleted、job.isFailed、job.isActive、job.isDelayed、job.isWaiting；
  JobsOptions、QueueOptions、WorkerOptions、ConnectionOptions、FlowJob、Processor；
  Worker.RateLimitError、UnrecoverableError、DelayedError、WaitingChildrenError；
  BullModule.forRoot、BullModule.registerQueue、BullModule.registerFlowProducer、
  @Processor、@WorkerHost、@InjectQueue、@InjectFlowProducer、@OnWorkerEvent、@OnQueueEvent。
  注意：v5 已棄用舊 Repeatable Jobs API，新的是 Job Schedulers（upsertJobScheduler）。
  v5 不再需要 QueueScheduler。v5 需要 Redis 6.2.0+ 或相容替代品（Dragonfly、Valkey）。
---

# BullMQ v5

> **版本對應**：bullmq ^5.x / @nestjs/bullmq ^10.x / ioredis ^5.x
> **文件來源**：https://docs.bullmq.io/
> **前提**：Redis 6.2.0+（或 Valkey / Dragonfly）、Node.js 18+

BullMQ 是基於 Redis 的分散式任務佇列，適合背景作業、排程任務、工作流（Flow）等。

---

## 目錄

1. [核心觀念速查](#核心觀念速查)
2. [Connection（Redis 連線）](#connectionredis-連線)
3. [Queue（佇列）](#queue佇列)
4. [Worker（處理器）](#worker處理器)
5. [Job（任務）](#job任務)
6. [QueueEvents（事件監聽）](#queueevents事件監聽)
7. [Job Schedulers（重複任務）](#job-schedulers重複任務)
8. [FlowProducer（工作流）](#flowproducer工作流)
9. [Rate Limiting（限流）](#rate-limiting限流)
10. [Retrying 與 Backoff](#retrying-與-backoff)
11. [UnrecoverableError 與停止重試](#unrecoverableerror-與停止重試)
12. [NestJS 整合（@nestjs/bullmq）](#nestjs-整合nestjsbullmq)
13. [生產環境建議](#生產環境建議)

---

## 核心觀念速查

| 角色 | 職責 | Class |
|------|------|-------|
| Queue | 生產者端，把 job 放入 Redis | `Queue` |
| Worker | 消費者端，從 Redis 取 job 執行 | `Worker` |
| Job | 個別任務，有資料、狀態、options | `Job` |
| QueueEvents | 監聽全域 queue 事件（跨 process） | `QueueEvents` |
| FlowProducer | 建立 parent-child 工作流 | `FlowProducer` |
| Job Scheduler | 產生重複（cron / every）任務的工廠 | `upsertJobScheduler` |

Job 狀態轉移：
`waiting → active → completed`  
`waiting → active → failed` (或 → `delayed` 後重試)  
`paused` 可暫停 queue  
`waiting-children` parent job 等待子任務完成

---

## Connection（Redis 連線）

### 基本

```typescript
import { Queue } from 'bullmq';

const queue = new Queue('myqueue', {
  connection: { host: 'localhost', port: 6379 },
});
```

### 共用 IORedis 實例（推薦）

```typescript
import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';

const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  password: 'secret',
  maxRetriesPerRequest: null,   // Worker 必須設 null
});

const queue = new Queue('myqueue', { connection });
const worker = new Worker('myqueue', processor, { connection });
```

**重要**：
- **Worker 的 connection 必須 `maxRetriesPerRequest: null`**，否則 blocking command 會失敗。
- Queue（生產者）可保留預設值（20）或設為低值以快速失敗。
- **不可使用 ioredis 的 `keyPrefix`**，BullMQ 有自己的 prefix 機制（建構子 `prefix` 選項）。
- Redis 必須 `maxmemory-policy=noeviction`，避免 key 被自動淘汰。

### 使用 URL

```typescript
const connection = new IORedis('rediss://user:pass@host:6380/0', {
  maxRetriesPerRequest: null,
});
```

### 自訂 Prefix（Multi-tenant / 隔離）

```typescript
new Queue('myqueue', {
  connection,
  prefix: 'bull',                // 預設 'bull'，可改 'bull:tenant1'
});
```

---

## Queue（佇列）

### 建構子

```typescript
import { Queue, QueueOptions } from 'bullmq';

const queue = new Queue<DataType, ReturnType, NameType>('myqueue', {
  connection,
  prefix: 'bull',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
  streams: {
    events: { maxLen: 10000 },
  },
  telemetry: { /* OpenTelemetry */ },
});
```

### 新增 Job

```typescript
// 基本
const job = await queue.add('paint', { color: 'red' });

// 帶 options
const job = await queue.add(
  'paint',
  { color: 'blue' },
  {
    jobId: 'custom-id',           // 自訂 id，可達成 deduplication
    delay: 5000,                  // 延遲 5 秒
    priority: 10,                 // 數字越小越優先（1 最高）
    attempts: 3,                  // 失敗重試次數
    backoff: { type: 'exponential', delay: 1000 },
    lifo: false,                  // LIFO 模式
    removeOnComplete: true,       // 或 { count: 1000, age: 3600 }
    removeOnFail: false,
    deduplication: { id: 'dedup-key', ttl: 60000 },
    debounce: { id: 'debounce-key', ttl: 5000 },
    sizeLimit: 1024,              // 單一 job data bytes 上限
    rateLimiterKey: 'user-123',   // 自訂限流 key
  },
);
```

### JobsOptions 全表

| 選項 | 型別 | 說明 |
|------|------|------|
| `jobId` | `string` | 自訂 id；衝突則忽略新 job |
| `delay` | `number` | 延遲毫秒 |
| `priority` | `number` | 1-2^21（越小越優先） |
| `attempts` | `number` | 失敗重試次數 |
| `backoff` | `{ type, delay, jitter? }` | `'fixed' \| 'exponential' \| 'custom'` |
| `lifo` | `boolean` | LIFO 模式（後進先出） |
| `removeOnComplete` | `boolean \| number \| { count, age }` | 完成後自動移除 |
| `removeOnFail` | `boolean \| number \| { count, age }` | 失敗後自動移除 |
| `deduplication` | `{ id, ttl?, extend?, replace? }` | 去重（TTL 期間同 id 只保留一個） |
| `debounce` | `{ id, ttl }` | Debounce（TTL 內重複 add 只觸發最後一個） |
| `sizeLimit` | `number` | Data bytes 上限 |
| `rateLimiterKey` | `string` | 自訂限流 bucket key |
| `parent` | `{ id, queue }` | 建立與 parent job 的關聯（Flow） |
| `failParentOnFailure` | `boolean` | 子失敗時 parent 也標記失敗 |
| `continueParentOnFailure` | `boolean` | 子失敗時仍推進 parent |
| `ignoreDependencyOnFailure` | `boolean` | 子失敗時 parent 忽略此依賴 |
| `repeat` | `RepeatOptions` | **已棄用**，改用 `upsertJobScheduler` |

### 批次新增

```typescript
await queue.addBulk([
  { name: 'paint', data: { color: 'red' } },
  { name: 'paint', data: { color: 'blue' }, opts: { delay: 1000 } },
]);
```

### 查詢 / 管理

```typescript
// 依狀態取 jobs
const jobs = await queue.getJobs(['waiting', 'active', 'delayed', 'completed', 'failed'], 0, -1, true);

// 各狀態計數
const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed', 'paused');

// 單一 job
const job = await queue.getJob('jobId');

// Pause / Resume（全域）
await queue.pause();     // worker 不再接新 job
await queue.resume();
const paused = await queue.isPaused();

// 清除
await queue.drain(delayed?: boolean);        // 移除所有 waiting + delayed（不動 active）
await queue.clean(grace, limit, type);       // type: 'completed' | 'failed' | 'wait' | 'active' | 'delayed' | 'paused' | 'prioritized'
await queue.obliterate({ force: true });     // 刪除整個 queue 包含 active jobs

// 關閉
await queue.close();
```

### Queue 事件（本地）

```typescript
queue.on('error', (err) => {});
queue.on('waiting', (job) => {});
queue.on('paused', () => {});
queue.on('resumed', () => {});
```

---

## Worker（處理器）

### 建構子

```typescript
import { Worker, Job } from 'bullmq';

const worker = new Worker<DataType, ReturnType, NameType>(
  'myqueue',
  async (job: Job, token?: string) => {
    await job.updateProgress(50);
    await job.log('starting');
    // ...work
    return { result: 'ok' };
  },
  {
    connection: { host: 'localhost', port: 6379, maxRetriesPerRequest: null },
    concurrency: 5,                // 並行 job 數
    autorun: true,                 // 自動啟動（否則需 worker.run()）
    limiter: {                     // 限流
      max: 100,
      duration: 1000,              // 每秒 100 個
    },
    metrics: { maxDataPoints: 24 * 60 },
    prefix: 'bull',
    name: 'my-worker',             // 監控顯示名
    lockDuration: 30000,           // 鎖定秒數
    stalledInterval: 30000,
    maxStalledCount: 1,
    drainDelay: 5,
    skipVersionCheck: false,
    useWorkerThreads: false,       // 用 worker_threads 隔離 processor
    settings: {                    // backoff 策略等
      backoffStrategy: (attemptsMade, type, err, job) => attemptsMade * 1000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
);
```

### Processor Function 簽名

```typescript
type Processor<D = any, R = any, N extends string = string> =
  (job: Job<D, R, N>, token?: string) => Promise<R>;
```

`token` 是 worker 目前處理該 job 的 lock token，需要呼叫 `job.moveToXXX(token)` 等手動 API 時會用到。

### 執行流程

```typescript
// autorun: false 時手動啟動
await worker.run();

// 暫停（不接新 job）
await worker.pause(doNotWaitActive?: boolean);

// 恢復
await worker.resume();

// 關閉
await worker.close(force?: boolean);

// 檢查
worker.isRunning();
worker.isPaused();
```

### Worker 事件

```typescript
worker.on('ready', () => {});
worker.on('active', (job, prev) => {});
worker.on('progress', (job, progress) => {});
worker.on('completed', (job, returnvalue) => {});
worker.on('failed', (job, error, prev) => {});
worker.on('error', (err) => {});     // 必須註冊，否則 unhandled
worker.on('stalled', (jobId, prev) => {});
worker.on('drained', () => {});      // 佇列暫時清空
worker.on('closed', () => {});
worker.on('closing', () => {});
```

### Sandbox Processor（獨立 process）

```typescript
// processor.ts
module.exports = async (job) => { /* ... */ return 'ok'; };

// main.ts
import path from 'path';
const worker = new Worker('myqueue', path.join(__dirname, 'processor.js'));
```

用於：
- 避免 CPU-bound 處理卡住 event loop
- 防止 memory leak 汙染主 process
- 每個 job 一個乾淨的 process

---

## Job（任務）

### 屬性

```typescript
interface Job<D = any, R = any, N = string> {
  id: string;
  name: N;
  data: D;
  opts: JobsOptions;
  progress: number | object;
  returnvalue: R;
  stacktrace: string[];
  attemptsMade: number;
  attemptsStarted: number;
  timestamp: number;             // 建立時間
  processedOn?: number;          // 開始處理時間
  finishedOn?: number;           // 完成時間
  delay: number;
  priority: number;
  parent?: { id, queueKey };
  token?: string;
  failedReason?: string;
}
```

### 方法（runtime 可用）

```typescript
// 進度
await job.updateProgress(50);
await job.updateProgress({ percent: 50, step: 'upload' });

// 日誌（可在 UI 查看）
await job.log('Started');
const logs = await job.getLogs(start?, end?, asc?);

// 更新 data
await job.updateData({ ...job.data, newField: 'x' });

// 查狀態
const state = await job.getState();  // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'waiting-children' | 'paused' | 'unknown'

// Predicates（從 Redis 查）
await job.isCompleted();
await job.isFailed();
await job.isActive();
await job.isDelayed();
await job.isWaiting();
await job.isWaitingChildren();

// 管理
await job.remove();
await job.retry('failed' | 'completed');
await job.promote();              // 延遲 job 提前執行
await job.discard();               // 把 job 標為不可重試

// 手動移動（通常 processor return 即可，但 manual fetch 模式會用）
await job.moveToCompleted(returnValue, token, fetchNext?);
await job.moveToFailed(error, token, fetchNext?);
await job.moveToDelayed(timestamp, token);
await job.moveToWaitingChildren(token, opts);   // 等待子任務

// 鎖
await job.extendLock(token, duration);

// 取結果（等待完成）
await job.waitUntilFinished(queueEvents, ttl?);  // 需要 QueueEvents 實例

// Flow 相關
await job.getChildrenValues();        // 所有子 job 回傳值
const deps = await job.getDependencies({ processed: { cursor, count }, unprocessed: { cursor, count } });
const counts = await job.getDependenciesCount();  // { processed, unprocessed, failed, ignored }
```

### 從 Queue 取回

```typescript
const job = await queue.getJob('jobId');
```

---

## QueueEvents（事件監聽）

**為什麼需要**：Worker 只能監聽自己 process 內發生的事件；若要從另一個 process / 服務監聽，要用 `QueueEvents`（底層基於 Redis Streams）。

```typescript
import { QueueEvents } from 'bullmq';

const queueEvents = new QueueEvents('myqueue', { connection });

queueEvents.on('waiting', ({ jobId }) => {});
queueEvents.on('active', ({ jobId, prev }) => {});
queueEvents.on('delayed', ({ jobId, delay }) => {});
queueEvents.on('progress', ({ jobId, data }) => {});
queueEvents.on('completed', ({ jobId, returnvalue, prev }) => {});
queueEvents.on('failed', ({ jobId, failedReason, prev }) => {});
queueEvents.on('removed', ({ jobId, prev }) => {});
queueEvents.on('stalled', ({ jobId }) => {});
queueEvents.on('duplicated', ({ jobId }) => {});
queueEvents.on('retries-exhausted', ({ jobId, attemptsMade }) => {});
queueEvents.on('cleaned', ({ count }) => {});
queueEvents.on('drained', () => {});
queueEvents.on('paused', () => {});
queueEvents.on('resumed', () => {});
queueEvents.on('added', ({ jobId, name }) => {});

// 等待某 job 完成
await queueEvents.waitUntilCompleted(jobId, ttl?);

// 關閉
await queueEvents.close();
```

---

## Job Schedulers（重複任務）

**v5.16+ 取代舊的 Repeatable Jobs**：更簡潔、支援更新、更可靠。

### 建立 / 更新 Scheduler

```typescript
// 每 1 秒觸發
await queue.upsertJobScheduler('my-scheduler-id', {
  every: 1000,
});

// cron（秒支援，6 欄位）
await queue.upsertJobScheduler(
  'daily-report',
  { pattern: '0 15 3 * * *' },     // 每日 03:15:00
  {
    name: 'report',
    data: { type: 'daily' },
    opts: {
      attempts: 5,
      backoff: 3,
      removeOnFail: 1000,
    },
  },
);

// cron 帶時區
await queue.upsertJobScheduler(
  'weekly',
  {
    pattern: '0 0 * * MON',
    tz: 'Asia/Taipei',
    utc: false,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    limit: 100,                    // 最多 100 次
    immediately: true,             // 立即執行一次再按排程
  },
  { name: 'weekly-report', data: {} },
);
```

### 管理

```typescript
// 列出所有 scheduler
const schedulers = await queue.getJobSchedulers();

// 取單一
const sch = await queue.getJobScheduler('my-scheduler-id');

// 計數
const count = await queue.getJobSchedulersCount();

// 刪除
await queue.removeJobScheduler('my-scheduler-id');
```

### 自訂 Repeat Strategy（例：RRULE）

```typescript
import { rrulestr } from 'rrule';

const queue = new Queue('myqueue', {
  connection,
  settings: {
    repeatStrategy: (millis: number, opts: any) => {
      const rrule = rrulestr(opts.pattern);
      return rrule.after(new Date(millis), false)?.getTime();
    },
  },
});

await queue.upsertJobScheduler('rrule-id', {
  pattern: 'RRULE:FREQ=DAILY;INTERVAL=1',
});
```

### 舊 Repeatable Jobs（不建議）

```typescript
// 僅作為 migration 參考
await queue.add('repeat', {}, { repeat: { pattern: '0 * * * *' } });
await queue.getRepeatableJobs();
await queue.removeRepeatableByKey(key);
```

新專案應改用 `upsertJobScheduler`。

---

## FlowProducer（工作流）

### 基本 Parent-Child

```typescript
import { FlowProducer } from 'bullmq';

const flow = new FlowProducer({ connection });

const tree = await flow.add({
  name: 'renovate',
  queueName: 'renovate',
  data: { house: 'main' },
  children: [
    { name: 'paint', queueName: 'steps', data: { place: 'ceiling' } },
    { name: 'paint', queueName: 'steps', data: { place: 'walls' } },
    { name: 'fix',   queueName: 'steps', data: { place: 'floor' } },
  ],
  opts: {
    attempts: 3,
  },
});

// tree.job 是 parent, tree.children 是子 jobs
```

**Parent 等所有 children 完成後才會 `active`**。

### 多層巢狀

```typescript
await flow.add({
  name: 'deploy',
  queueName: 'pipeline',
  children: [
    {
      name: 'build',
      queueName: 'pipeline',
      children: [
        { name: 'lint', queueName: 'pipeline' },
        { name: 'test', queueName: 'pipeline' },
      ],
    },
    { name: 'package', queueName: 'pipeline' },
  ],
});
```

### 在 processor 中存取子結果

```typescript
const worker = new Worker('renovate', async (job) => {
  const childValues = await job.getChildrenValues();
  // { 'jobKey1': {...}, 'jobKey2': {...} }
});
```

### 手動加入依賴

```typescript
await parentJob.moveToWaitingChildren(token);

// Child 失敗時 parent 行為
const flow = await flowProducer.add({
  name: 'parent',
  queueName: 'q',
  opts: { failParentOnFailure: true },  // 任一子失敗 → parent 失敗
  children: [{
    name: 'child',
    queueName: 'q',
    opts: { ignoreDependencyOnFailure: true }, // 或此子失敗 parent 仍跑
  }],
});
```

### 取得 Flow Tree

```typescript
const tree = await flow.getFlow({ id: jobId, queueName: 'q', depth: 3 });
```

### 批次 Flow

```typescript
await flow.addBulk([{ name: 'f1', queueName: 'q' }, { name: 'f2', queueName: 'q' }]);
```

### 關閉

```typescript
await flow.close();
```

---

## Rate Limiting（限流）

### 靜態限流（Worker 選項）

```typescript
const worker = new Worker('myqueue', processor, {
  connection,
  limiter: {
    max: 10,                       // 每 duration 內最多 10 個 job
    duration: 1000,                // 1 秒
  },
});
```

此限制為 queue 層級（所有 worker 加總）。

### 動態限流（runtime 決定）

```typescript
const worker = new Worker(
  'myqueue',
  async (job) => {
    const [limited, retryAfter] = await callExternalAPI();
    if (limited) {
      await worker.rateLimit(retryAfter);       // 告訴 BullMQ 暫停 retryAfter ms
      throw Worker.RateLimitError();            // 標記為非失敗（會被重新排入 waiting）
    }
    return { ok: true };
  },
  { connection, limiter: { max: 1, duration: 500 } },
);
```

`Worker.RateLimitError` 是一個 sentinel error，告訴 BullMQ 這不是真的失敗。

### 全域限流（所有 queue instances）

```typescript
const queue = new Queue('myqueue', {
  connection,
  // 全域限流（v5+）
});
```

參考 `references/rate-limiting-patterns.md`。

---

## Retrying 與 Backoff

### 基本設定

```typescript
await queue.add('work', data, {
  attempts: 5,                     // 重試 5 次（共 5 次嘗試）
  backoff: {
    type: 'exponential',           // 2^(n-1) * delay
    delay: 1000,
  },
});
```

### Fixed Backoff

```typescript
{ attempts: 3, backoff: { type: 'fixed', delay: 2000 } }
```

### 加入 Jitter（隨機化）

```typescript
{
  attempts: 8,
  backoff: { type: 'exponential', delay: 3000, jitter: 0.5 },  // ±50%
}
```

Jitter 打散重試尖峰，避免 thundering herd。

### 自訂 Backoff Strategy

```typescript
const worker = new Worker('q', processor, {
  connection,
  settings: {
    backoffStrategy: (attemptsMade, type, err, job) => {
      if (type === 'my-strategy') return attemptsMade * 1000;
      throw new Error('unknown');
    },
  },
});

await queue.add('work', {}, {
  attempts: 3,
  backoff: { type: 'my-strategy' },
});
```

---

## UnrecoverableError 與停止重試

### 不重試立即失敗

```typescript
import { UnrecoverableError } from 'bullmq';

const worker = new Worker('q', async (job) => {
  if (job.data.invalid) {
    throw new UnrecoverableError('bad input');    // 跳過所有重試
  }
}, { connection });
```

### DelayedError（延遲重試）

```typescript
import { DelayedError } from 'bullmq';

const worker = new Worker('q', async (job, token) => {
  await job.moveToDelayed(Date.now() + 60000, token);
  throw new DelayedError();   // 告訴 BullMQ job 已被手動 delay
});
```

### WaitingChildrenError（等待子任務）

```typescript
import { WaitingChildrenError } from 'bullmq';

const worker = new Worker('parent', async (job, token) => {
  // 加入子任務...
  await job.moveToWaitingChildren(token);
  throw new WaitingChildrenError();
});
```

---

## NestJS 整合（@nestjs/bullmq）

### 安裝

```bash
npm i @nestjs/bullmq bullmq ioredis
```

### 根模組

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
      },
    }),
  ],
})
export class AppModule {}
```

### Async 設定

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    connection: {
      host: config.get('REDIS_HOST'),
      port: +config.get('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'),
      maxRetriesPerRequest: null,
    },
  }),
});
```

### 註冊 Queue

```typescript
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: { attempts: 3 },
    }),
    BullModule.registerQueue({ name: 'reports' }),
  ],
})
export class QueueModule {}
```

### 注入 Queue（Producer）

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async sendWelcome(userId: number) {
    await this.emailQueue.add('welcome', { userId });
  }
}
```

### Processor（Worker）

```typescript
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email', { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  async process(job: Job<{ userId: number }>, token?: string): Promise<void> {
    switch (job.name) {
      case 'welcome':
        await this.sendWelcome(job.data.userId);
        break;
      case 'reset-password':
        await this.sendReset(job.data);
        break;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`${job.id} done`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`${job.id} failed`, error);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {}
}
```

**注意**：`@Processor` 所裝飾的類必須在該 Feature Module 的 `providers` 陣列中。

### FlowProducer

```typescript
// 註冊
BullModule.registerFlowProducer({ name: 'deploy-flow' });

// 注入
@Injectable()
export class DeployService {
  constructor(
    @InjectFlowProducer('deploy-flow') private flow: FlowProducer,
  ) {}

  async run() {
    await this.flow.add({ name: 'deploy', queueName: 'pipeline', children: [] });
  }
}
```

### QueueEvents Listener（跨 process 事件）

```typescript
import { QueueEventsListener, QueueEventsHost, OnQueueEvent } from '@nestjs/bullmq';

@QueueEventsListener('email')
export class EmailQueueEvents extends QueueEventsHost {
  @OnQueueEvent('completed')
  onCompleted({ jobId, returnvalue }: { jobId: string; returnvalue: string }) {}

  @OnQueueEvent('failed')
  onFailed({ jobId, failedReason }: { jobId: string; failedReason: string }) {}
}
```

---

## 生產環境建議

1. **`maxmemory-policy=noeviction`**：Redis 必須這樣設，否則 key 可能被淘汰。
2. **`maxRetriesPerRequest: null`** on Worker connection：blocking command 需要。
3. **分開 Queue 與 Worker 的 Redis client**：避免 Worker 的長連接阻塞 producer。
4. **Graceful shutdown**：收到 SIGTERM 時 `await worker.close()`，讓 active job 跑完。
5. **`removeOnComplete / removeOnFail`**：永遠設定，否則 Redis 會累積無限 completed/failed job metadata。
6. **`lockDuration`**：若 job 可能跑超過 30 秒，要調大，並在長任務裡 `job.extendLock(token, ms)`。
7. **Idempotency**：使用 `jobId` + business key 防止重複執行；worker 要假設可能被重試。
8. **Monitor**：接 `error` 事件、監聽 `stalled` / `failed` 事件；用 Bull Board / Arena / Prometheus。
9. **Sandbox processor**：CPU-bound 任務用獨立 process 隔離。
10. **`concurrency` 選擇**：I/O-bound 可設高（100+），CPU-bound 通常 = CPU 核心數。

---

## 常見陷阱

| 症狀 | 原因 | 解法 |
|------|------|------|
| `maxRetriesPerRequest` 警告 / connection 失敗 | Worker 連線未設 `null` | `new IORedis({ maxRetriesPerRequest: null })` |
| Job 跑到一半被 stalled | `lockDuration` 太短 | 調大或週期 `job.extendLock` |
| 重複執行同一 job | 未設 `jobId` 或業務層未 idempotent | 用業務唯一 id 當 jobId |
| Queue 無限增大 | 沒設 `removeOnComplete/Fail` | 加上 `{ age, count }` |
| 定期任務錯過 | 用舊 Repeatable Jobs API | 改用 `upsertJobScheduler` |
| Worker 無法關閉 | active job 卡住 | `worker.close(true)` 強制；設定 grace period |
| Flow parent 永遠 waiting-children | 子任務 `failParentOnFailure` 或 missing | 檢查 parent options 與 child 狀態 |
| ioredis `keyPrefix` 衝突 | 使用了 ioredis 的 prefix | 改用 BullMQ `prefix` 選項 |
