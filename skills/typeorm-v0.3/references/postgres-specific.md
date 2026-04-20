# TypeORM + PostgreSQL 專用補充

## Column types only PostgreSQL 支援

| Type | 說明 |
|------|------|
| `uuid` | UUID 原生型別 |
| `jsonb` | binary JSON，可索引 |
| `json` | plain JSON（不推薦，改用 jsonb） |
| `tsvector` | 全文檢索向量 |
| `tsquery` | 全文檢索查詢 |
| `cidr` / `inet` / `macaddr` | 網路位址 |
| `int4range` / `tstzrange` / `daterange` | 範圍型別 |
| `money` | 貨幣 |
| `interval` | 時間區間 |
| `hstore` | key-value 字典 |
| `point` / `line` / `polygon` | 幾何型別 |
| `geometry` / `geography` | PostGIS |

### 陣列

```typescript
@Column('int', { array: true })
scores: number[];

@Column('text', { array: true, default: '{}' })
tags: string[];
```

### JSON / JSONB

```typescript
@Column('jsonb')
meta: Record<string, any>;

@Column({ type: 'jsonb', default: {} })
settings: { theme?: string; locale?: string };
```

查詢 JSONB：

```typescript
qb.where(`entity.meta @> :filter`, { filter: JSON.stringify({ key: 'value' }) });
qb.where(`entity.meta->>'theme' = :theme`, { theme: 'dark' });
qb.where(`entity.tags ?| array[:...tags]`, { tags: ['a', 'b'] });
```

### Enum

```typescript
@Column({ type: 'enum', enum: ['admin', 'user'], enumName: 'role_enum' })
role: string;
```

Migration 變更 enum 值：

```typescript
// 新增值
await qr.query(`ALTER TYPE role_enum ADD VALUE 'editor'`);

// 移除值（需手動重建 type）
await qr.query(`
  ALTER TYPE role_enum RENAME TO role_enum_old;
  CREATE TYPE role_enum AS ENUM ('admin', 'user');
  ALTER TABLE users ALTER COLUMN role TYPE role_enum USING role::text::role_enum;
  DROP TYPE role_enum_old;
`);
```

## pgvector（向量搜尋）

```typescript
// 啟用 extension（DataSource option）
new DataSource({
  type: 'postgres',
  installExtensions: true,
  extra: { options: '-c search_path=public' },
});

// 或 migration 手動
await qr.query(`CREATE EXTENSION IF NOT EXISTS vector`);

@Entity()
export class Document {
  @PrimaryGeneratedColumn() id: number;

  @Column('text')
  content: string;

  @Column('vector', { length: 1536 })
  embedding: number[];
}

// 查詢相似
const similar = await repo
  .createQueryBuilder('d')
  .addSelect(`d.embedding <=> :v`, 'distance')
  .setParameters({ v: `[${queryVec.join(',')}]` })
  .orderBy('distance', 'ASC')
  .limit(10)
  .getRawAndEntities();

// Index（migration 內）
await qr.query(`
  CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
`);
```

## 全文檢索

```typescript
@Entity()
@Index(['title', 'content'], { fulltext: true })   // MySQL
export class Post {
  @Column() title: string;
  @Column() content: string;

  // Postgres 手動欄
  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', title || ' ' || content)`,
  })
  searchVector: string;
}

// 查詢
qb.where(`post.searchVector @@ to_tsquery('english', :q)`, { q: 'typeorm' });
```

Postgres index：

```sql
CREATE INDEX post_search_idx ON post USING gin(search_vector);
```

## Advisory lock

Postgres 專用 app-level 鎖：

```typescript
await ds.query(`SELECT pg_advisory_lock($1)`, [lockId]);
try { /* work */ } finally {
  await ds.query(`SELECT pg_advisory_unlock($1)`, [lockId]);
}
```

## LISTEN / NOTIFY

```typescript
// TypeORM DataSource option
new DataSource({
  type: 'postgres',
  logNotifications: true,
});

// 自訂監聽（繞過 TypeORM 用原生 pg client）
// 通常需要一條專屬 connection，不建議透過 ORM
```

## Replication（讀寫分離）

```typescript
new DataSource({
  type: 'postgres',
  replication: {
    master: { host: 'primary', port: 5432, username, password, database },
    slaves: [
      { host: 'replica1', port: 5432, username, password, database },
      { host: 'replica2', port: 5432, username, password, database },
    ],
  },
});
```

TypeORM 自動把寫操作送到 master，讀操作輪詢 slaves。強制單 connection 可用 `queryRunner.connect('master')`。

## 序列（Sequence）

```typescript
// Migration
await qr.query(`CREATE SEQUENCE order_number_seq START 1000`);

@Column({ default: () => `nextval('order_number_seq')` })
orderNumber: number;
```

## 注意事項

1. **`synchronize: true` 對 PostgreSQL enum 處理不完善**：改 enum 值用 migration。
2. **JSONB 的 where 用 TypeScript 物件直接比對**：TypeORM 會 serialize，但若需要 `@>` 等 operator，必須用 Raw。
3. **Array column 比對**：需用 `ArrayContains`、`ArrayOverlap` 或 Raw。
4. **時區**：建議所有 timestamp 用 `timestamptz`，程式內一律 UTC。
5. **Connection pool 設定**：`extra: { max: 20, connectionTimeoutMillis: 3000 }`；與 PgBouncer 搭配時設 `statement_cache_size: 0`。
