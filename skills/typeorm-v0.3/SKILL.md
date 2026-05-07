---
name: typeorm-v0.3
description: >
  TypeORM v0.3 技術參考，對應 typeorm ^0.3.x，需 TypeScript 4.5+、Node.js 16+，
  experimentalDecorators 與 emitDecoratorMetadata 開啟。預設對 PostgreSQL 但 API DB-agnostic。
  當 import from 'typeorm' 或 '@nestjs/typeorm' 時必須使用此 skill。代表性 trigger：
  new DataSource、createQueryBuilder、@Entity、@Column、@PrimaryGeneratedColumn、
  @CreateDateColumn/@UpdateDateColumn/@DeleteDateColumn、@OneToMany/@ManyToOne/@ManyToMany、
  @JoinColumn/@JoinTable、Repository、EntityManager、SelectQueryBuilder、FindOptionsWhere、
  FindManyOptions、Not/LessThan/MoreThan/Between/In/IsNull/Like/ILike/Raw、Brackets、
  MigrationInterface、TypeOrmModule.forRoot/forFeature、@InjectRepository、@InjectDataSource。
  v0.3 對 v0.2 重要 breaking changes：DataSource 取代 Connection、Repository 不再是抽象類、
  QueryBuilder 改用命名參數、FindOptions API 強型別化。涵蓋 Entity、Relations、Repository API、
  Find Options、QueryBuilder、Transactions、Migrations、Listeners/Subscribers、NestJS 整合。
---

# TypeORM v0.3

> **版本對應**：typeorm ^0.3.x（PostgreSQL + pg driver）
> **文件來源**：https://typeorm.io/docs
> **前提**：TypeScript 4.5+ / Node.js 16+ / experimentalDecorators 與 emitDecoratorMetadata 開啟

---

## 目錄

1. [DataSource 與設定](#datasource-與設定)
2. [Entity 定義](#entity-定義)
3. [@Column 選項總表](#column-選項總表)
4. [Primary Columns 與 Generated](#primary-columns-與-generated)
5. [特殊日期 Column](#特殊日期-column)
6. [Entity Inheritance 與 Tree](#entity-inheritance-與-tree)
7. [關聯（Relations）](#關聯relations)
8. [Repository API](#repository-api)
9. [Find Options](#find-options)
10. [QueryBuilder](#querybuilder)
11. [Transactions](#transactions)
12. [Migrations](#migrations)
13. [Listeners & Subscribers](#listeners--subscribers)
14. [NestJS 整合（@nestjs/typeorm）](#nestjs-整合nestjstypeorm)

詳細請見 `references/`：
- `references/advanced-query.md` — QueryBuilder 進階、CTE、子查詢、Lock
- `references/postgres-specific.md` — 陣列型別、JSON、pgvector、geometric
- `references/migrations-full.md` — QueryRunner 完整 API

---

## DataSource 與設定

### DataSource 建立

```typescript
import { DataSource } from 'typeorm';
import { User } from './entity/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'secret',
  database: 'mydb',
  schema: 'public',
  synchronize: false,              // 正式環境必須 false，使用 migration
  logging: ['error', 'warn'],      // 或 true / false / 'all'
  logger: 'advanced-console',      // 'simple-console' | 'file' | 'debug'
  entities: [User],                // 或 ['src/entity/*.ts']
  migrations: ['src/migration/*.ts'],
  subscribers: [],
  namingStrategy: new SnakeNamingStrategy(),
  maxQueryExecutionTime: 1000,     // 慢查詢門檻 ms
  extra: {                         // 傳給 underlying driver (pg)
    max: 20,                       // pool max
    connectionTimeoutMillis: 3000,
  },
  ssl: { rejectUnauthorized: false },
  cache: { duration: 30000 },      // 全域 query cache
});

await AppDataSource.initialize();
```

### 常用 DataSource 選項

| 選項 | 說明 |
|------|------|
| `type` | `'postgres' \| 'mysql' \| 'mariadb' \| 'sqlite' \| 'mssql' \| 'oracle' \| 'mongodb' \| 'cockroachdb'` |
| `entities` | Entity 陣列或 glob 模式 |
| `migrations` | Migration 陣列或 glob 模式 |
| `migrationsRun` | 啟動時自動執行 migration |
| `migrationsTableName` | 預設 `typeorm_migrations` |
| `migrationsTransactionMode` | `'all'（預設）`、`'each'`、`'none'` |
| `synchronize` | 自動建表（**正式環境禁用**） |
| `dropSchema` | 啟動時清空 schema |
| `logging` | `boolean \| 'all' \| LoggerOptions[]`，例：`['query', 'error', 'warn', 'info', 'migration']` |
| `maxQueryExecutionTime` | 超過時間的查詢會被 log |
| `entityPrefix` | 所有表加前綴 |
| `cache` | `boolean \| { type, duration, options }`，支援 redis/ioredis |
| `extra` | 傳給 driver 的額外選項 |

### PostgreSQL-specific

```typescript
{
  type: 'postgres',
  schema: 'public',
  ssl: true | { rejectUnauthorized, ca, cert, key },
  applicationName: 'my-app',
  connectTimeoutMS: 10000,
  replication: {
    master: { host, port, username, password, database },
    slaves: [{ host, port, username, password, database }],
  },
  installExtensions: true,       // 自動 CREATE EXTENSION
  logNotifications: true,
  poolErrorHandler: (err) => {},
}
```

### 生命週期

```typescript
const ds = new DataSource({ /* ... */ });
await ds.initialize();       // 建立連線池
ds.isInitialized;            // true
await ds.destroy();          // 關閉所有連線

const repo = ds.getRepository(User);
const treeRepo = ds.getTreeRepository(Category);
const manager = ds.manager;
const qb = ds.createQueryBuilder();

await ds.transaction(async (manager) => { /* ... */ });
await ds.query('SELECT NOW()');
await ds.synchronize();       // 危險，僅開發
await ds.dropDatabase();      // 危險
```

---

## Entity 定義

### 基本 Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isActive: boolean;
}
```

### @Entity 選項

```typescript
@Entity({
  name: 'users',              // 自訂表名（預設小駝峰 class 名）
  schema: 'public',           // schema
  synchronize: true,          // 是否讓這個 entity 參與 synchronize
  orderBy: { id: 'ASC' },     // 預設排序
  database: 'otherdb',        // 使用其他 DB
  engine: 'MyISAM',           // MySQL-only
  withoutRowid: false,        // SQLite-only
})
```

---

## @Column 選項總表

```typescript
@Column({
  type: 'varchar',            // ColumnType（見下表）
  name: 'user_name',          // 自訂欄位名
  length: 150,                // VARCHAR length
  nullable: false,            // 預設 false
  default: 'anonymous',       // DEFAULT 值
  unique: false,              // UNIQUE 約束
  primary: false,             // 是否為 primary
  select: true,               // 查詢時是否預設包含（密碼欄可設 false）
  update: true,               // save 時會更新
  insert: true,               // insert 時會寫入
  onUpdate: 'CURRENT_TIMESTAMP', // MySQL ON UPDATE
  comment: 'User display name',
  precision: 10,              // 數字精度
  scale: 2,                   // 小數位數
  unsigned: false,            // MySQL
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  enum: UserRole,             // enum
  enumName: 'user_role_enum', // Postgres 的 enum 型別名
  array: false,               // Postgres/CockroachDB 陣列
  transformer: {
    to: (value) => JSON.stringify(value),
    from: (value) => JSON.parse(value),
  },
  asExpression: 'age + 1',    // Generated column
  generatedType: 'VIRTUAL',   // 'VIRTUAL' | 'STORED'
  hstoreType: 'object',       // 'object' | 'string'
  utc: false,                 // 日期以 UTC 存
  primaryKeyConstraintName: 'PK_users_id',
  foreignKeyConstraintName: 'FK_users_role_id',
})
```

### 常用 Column Types

**共通**：`int`、`bigint`、`smallint`、`decimal`、`numeric`、`float`、`double`、`real`、
`boolean`、`varchar`、`char`、`text`、`date`、`time`、`datetime`、`timestamp`、
`json`、`jsonb`、`uuid`、`enum`、`blob`、`bytea`

**Postgres 特有**：`tsvector`、`tstzrange`、`daterange`、`cidr`、`inet`、`macaddr`、
`money`、`interval`、`hstore`、`point`、`polygon`、`line`、`geometry`、`geography`、
陣列型別（例：`int[]` 用 `{ type: 'int', array: true }`）

**Vector（pgvector）**：

```typescript
@Column('vector', { length: 1536 })
embedding: number[] | Buffer;

@Column('halfvec', { length: 4 })
halfvec_embedding: number[] | Buffer;
```

### Enum Column

```typescript
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  GHOST = 'ghost',
}

@Column({ type: 'enum', enum: UserRole, default: UserRole.GHOST })
role: UserRole;

// 或用字串陣列
@Column({ type: 'enum', enum: ['admin', 'editor', 'ghost'], default: 'ghost' })
role: string;
```

### Simple Array / Simple JSON（跨 DB 用）

```typescript
@Column('simple-array')
tags: string[];     // 存成 'tag1,tag2,tag3'（值內不可有逗號）

@Column('simple-json')
profile: { name: string };  // JSON.stringify / JSON.parse

@Column('simple-enum', { enum: UserRole })
role: UserRole;     // SQLite 上用 text 模擬 enum
```

---

## Primary Columns 與 Generated

```typescript
// 手動主鍵
@PrimaryColumn()
id: string;

// 組合主鍵
@PrimaryColumn()
firstName: string;
@PrimaryColumn()
lastName: string;

// 自動遞增
@PrimaryGeneratedColumn()
id: number;

// UUID
@PrimaryGeneratedColumn('uuid')
id: string;

// Postgres 10+ IDENTITY 欄
@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
id: number;

// CockroachDB rowid
@PrimaryGeneratedColumn('rowid')
id: string;

// MongoDB 專用
@ObjectIdColumn()
id: ObjectId;
```

### @Generated 用於非 PK

```typescript
@Column()
@Generated('uuid')
uuid: string;

@Column()
@Generated('increment')
num: number;

// 計算欄
@Column({ type: 'int', asExpression: 'price * quantity', generatedType: 'STORED' })
total: number;
```

---

## 特殊日期 Column

```typescript
@CreateDateColumn()
createdAt: Date;        // 自動於 insert 填入

@UpdateDateColumn()
updatedAt: Date;        // 自動於 save / upsert 更新

@DeleteDateColumn()
deletedAt: Date | null; // softDelete 時填入，預設查詢排除此行

@VersionColumn()
version: number;        // 每次 save 自動 +1，用於 optimistic lock
```

---

## Entity Inheritance 與 Tree

### Abstract 繼承（共用欄位）

```typescript
export abstract class Content {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
}

@Entity()
export class Photo extends Content {
  @Column() size: string;
}

@Entity()
export class Post extends Content {
  @Column() viewCount: number;
}
```

### Single Table Inheritance

```typescript
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Content { @PrimaryGeneratedColumn() id: number; }

@ChildEntity()
export class Photo extends Content { @Column() size: string; }
```

### Tree Entities

```typescript
// Adjacency list（最簡單）
@Entity()
export class Category {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;

  @ManyToOne(() => Category, (c) => c.children)
  parent: Category;

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[];
}

// Closure-table
@Entity()
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;

  @TreeChildren() children: Category[];
  @TreeParent() parent: Category;
  @TreeLevelColumn() level: number;
}

// Materialized-path / Nested-set 類似

// 使用
const treeRepo = ds.getTreeRepository(Category);
await treeRepo.findTrees();
await treeRepo.findDescendantsTree(cat);
await treeRepo.findAncestorsTree(cat);
await treeRepo.countDescendants(cat);
```

### Embedded Entity

```typescript
export class Name {
  @Column() first: string;
  @Column() last: string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column(() => Name) name: Name;   // 產生 nameFirst、nameLast 欄位
}
```

---

## 關聯（Relations）

### @OneToOne

```typescript
// 擁有端（有 FK）
@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number;

  @OneToOne(() => Profile, (p) => p.user, { cascade: true, eager: true })
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile: Profile;
}

// 反向端
@Entity()
export class Profile {
  @PrimaryGeneratedColumn() id: number;

  @OneToOne(() => User, (u) => u.profile)
  user: User;
}
```

### @ManyToOne / @OneToMany（一對多）

FK 一律在 many 端：

```typescript
@Entity()
export class Photo {
  @PrimaryGeneratedColumn() id: number;

  @ManyToOne(() => User, (u) => u.photos, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
    nullable: false,
  })
  user: User;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number;

  @OneToMany(() => Photo, (p) => p.user, { cascade: ['insert'] })
  photos: Photo[];
}
```

### @ManyToMany + @JoinTable

```typescript
@Entity()
export class Question {
  @PrimaryGeneratedColumn() id: number;

  @ManyToMany(() => Category, (c) => c.questions, { cascade: true })
  @JoinTable({
    name: 'question_categories',
    joinColumn: { name: 'question_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];
}

@Entity()
export class Category {
  @PrimaryGeneratedColumn() id: number;

  @ManyToMany(() => Question, (q) => q.categories)
  questions: Question[];
}
```

### Relation Options

```typescript
{
  cascade: true | ['insert', 'update', 'remove', 'soft-remove', 'recover'],
  eager: false,                  // find 時自動 join
  lazy: false,                   // 用 Promise 包，存取時才載入
  nullable: true,
  onDelete: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'DEFAULT',
  onUpdate: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'DEFAULT',
  orphanedRowAction: 'nullify' | 'delete' | 'soft-delete' | 'disable',
  deferrable: 'INITIALLY DEFERRED' | 'INITIALLY IMMEDIATE',   // Postgres
  createForeignKeyConstraints: true,
  persistence: true,             // false 可讓該關聯在 save 時被忽略
  primary: false,
  foreignKeyConstraintName: 'FK_xxx',
}
```

### @JoinColumn 進階

```typescript
// 自訂 FK 欄名
@ManyToOne(() => Category)
@JoinColumn({ name: 'cat_id' })
category: Category;

// 複合 FK
@ManyToOne(() => Category)
@JoinColumn([
  { name: 'category_id', referencedColumnName: 'id' },
  { name: 'locale_id', referencedColumnName: 'locale_id' },
])
category: Category;
```

### @RelationId（只取 FK 不 join）

```typescript
@Entity()
export class Post {
  @ManyToOne(() => Author)
  author: Author;

  @RelationId((post: Post) => post.author)
  authorId: number;
}
```

---

## Repository API

### 取得 Repository

```typescript
const repo = dataSource.getRepository(User);
const repo = manager.getRepository(User);
// NestJS
constructor(@InjectRepository(User) private repo: Repository<User>) {}
```

### CRUD

```typescript
// Create（非持久化）
const user = repo.create({ firstName: 'John', lastName: 'Doe' });

// Save（insert or update）
await repo.save(user);
await repo.save([user1, user2]);

// Insert（純 insert，不 load relations）
await repo.insert({ firstName: 'Jane' });

// Update
await repo.update(id, { firstName: 'Jane' });
await repo.update({ active: false }, { deleted: true });

// Upsert
await repo.upsert(
  [{ id: 1, name: 'a' }, { id: 2, name: 'b' }],
  ['id']  // conflict paths
);

// Delete
await repo.delete(id);
await repo.delete({ active: false });
await repo.remove(entity);    // 等同 delete 但走 entity flow（觸發 listener）

// Soft delete / restore
await repo.softDelete(id);
await repo.restore(id);
await repo.softRemove(entity);
await repo.recover(entity);

// Count / exists
await repo.count({ where: { active: true } });
await repo.countBy({ active: true });
await repo.exists({ where: { id: 1 } });
await repo.existsBy({ id: 1 });

// 聚合
await repo.sum('price', { active: true });
await repo.average('price', { active: true });
await repo.minimum('price', { active: true });
await repo.maximum('price', { active: true });

// 增減
await repo.increment({ id: 1 }, 'viewCount', 1);
await repo.decrement({ id: 1 }, 'stock', 5);
```

### Find

```typescript
await repo.find({ where: { active: true } });
await repo.findBy({ active: true });
await repo.findOne({ where: { id: 1 }, relations: { profile: true } });
await repo.findOneBy({ id: 1 });
await repo.findOneOrFail({ where: { id: 1 } });    // throw 找不到
await repo.findOneByOrFail({ id: 1 });
const [rows, count] = await repo.findAndCount({ where: {}, skip: 0, take: 10 });
await repo.findAndCountBy({ active: true });
```

### Preload / Merge

```typescript
// preload：找到則從 DB 載入合併，找不到回 undefined
const user = await repo.preload({ id: 1, firstName: 'Jane' });

// merge：把多個物件合併到同個 entity instance
repo.merge(user, update1, update2);
```

### 原生 SQL

```typescript
await repo.query('SELECT * FROM users WHERE id = $1', [1]);
```

### QueryBuilder

```typescript
repo.createQueryBuilder('u').where('u.active = :active', { active: true });
```

---

## Find Options

### FindManyOptions

```typescript
interface FindManyOptions<T> {
  select?: FindOptionsSelect<T>;        // 欄位選擇
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];  // 陣列 = OR
  relations?: FindOptionsRelations<T>;  // 關聯載入
  relationLoadStrategy?: 'join' | 'query';  // 預設 join
  loadEagerRelations?: boolean;         // 預設 true
  loadRelationIds?: boolean | { relations?: string[]; disableMixedMap?: boolean };
  order?: FindOptionsOrder<T>;
  skip?: number;                        // offset
  take?: number;                        // limit
  cache?: boolean | number | { id: any; milliseconds: number };
  lock?: { mode: 'optimistic'; version: number } | { mode: LockMode };
  withDeleted?: boolean;                // 包含 soft-deleted
  transaction?: boolean;
  comment?: string;
}

type LockMode = 'pessimistic_read' | 'pessimistic_write' | 'dirty_read'
  | 'pessimistic_partial_write' | 'pessimistic_write_or_fail' | 'for_no_key_update'
  | 'for_key_share';
```

### FindOptionsWhere 範例

```typescript
// 欄位比對
await repo.find({ where: { firstName: 'John', age: 30 } });

// 多條件 OR（陣列）
await repo.find({
  where: [{ firstName: 'John' }, { lastName: 'Doe' }],
});

// 關聯內條件
await repo.find({
  where: { profile: { gender: 'male' } },
  relations: { profile: true },
});

// 巢狀 relation
await repo.find({
  relations: { photos: { album: true } },
});
```

### 操作符

```typescript
import { Not, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual,
  Equal, Like, ILike, Between, In, Any, IsNull,
  ArrayContains, ArrayContainedBy, ArrayOverlap, Raw,
  And, Or } from 'typeorm';

await repo.find({ where: { age: Not(30) } });
await repo.find({ where: { age: LessThan(18) } });
await repo.find({ where: { age: MoreThanOrEqual(18) } });
await repo.find({ where: { firstName: Like('%john%') } });
await repo.find({ where: { firstName: ILike('%JOHN%') } });  // Postgres
await repo.find({ where: { age: Between(18, 60) } });
await repo.find({ where: { id: In([1, 2, 3]) } });
await repo.find({ where: { name: IsNull() } });

// Postgres 陣列
await repo.find({ where: { tags: ArrayContains(['a', 'b']) } });
await repo.find({ where: { tags: ArrayOverlap(['x']) } });

// Raw（參數化）
await repo.find({ where: { createdAt: Raw((alias) => `${alias} > NOW() - INTERVAL '1 day'`) } });
await repo.find({
  where: { createdAt: Raw((alias) => `${alias} > :date`, { date: '2025-01-01' }) },
});

// 組合
await repo.find({ where: { age: And(MoreThan(18), LessThan(60)) } });
await repo.find({ where: { status: Or(Equal('a'), Equal('b')) } });
```

---

## QueryBuilder

### 建立

```typescript
const qb = repo.createQueryBuilder('u');
const qb = ds.createQueryBuilder().select('u').from(User, 'u');
const qb = ds.manager.createQueryBuilder(User, 'u');
```

### SELECT 與 JOIN

```typescript
qb.select('u')
  .addSelect('SUM(u.count)', 'total')
  .distinct(true)
  .distinctOn(['u.id'])                  // Postgres

  // JOIN + SELECT
  .leftJoinAndSelect('u.photos', 'p')
  .innerJoinAndSelect('u.profile', 'pr')
  .leftJoinAndSelect('u.photos', 'p', 'p.isRemoved = :removed', { removed: false })

  // JOIN 不 SELECT
  .leftJoin('u.photos', 'p')

  // JOIN + 映射為非關聯屬性
  .leftJoinAndMapOne('u.profilePhoto', 'u.photos', 'pp', 'pp.forProfile = TRUE')
  .leftJoinAndMapMany('u.comments', Comment, 'c', 'c.userId = u.id')

  // JOIN 非關聯 entity
  .leftJoinAndSelect(Photo, 'ph', 'ph.userId = u.id');
```

### WHERE / HAVING

```typescript
qb.where('u.age >= :min', { min: 18 })
  .andWhere('u.active = :active', { active: true })
  .orWhere('u.role = :role', { role: 'admin' });

// IN
qb.where('u.id IN (:...ids)', { ids: [1, 2, 3] });

// Brackets
import { Brackets, NotBrackets } from 'typeorm';
qb.where(new Brackets((b) => {
  b.where('u.first = :f', { f: 'a' }).orWhere('u.last = :l', { l: 'b' });
}));

// HAVING
qb.groupBy('u.id').having('COUNT(u.id) > :n', { n: 5 });
```

### ORDER / GROUP / LIMIT

```typescript
qb.orderBy('u.id', 'DESC')
  .addOrderBy('u.name', 'ASC')
  .orderBy({ 'u.name': 'ASC', 'u.id': 'DESC' })
  .groupBy('u.id').addGroupBy('u.name')
  .limit(10).offset(20)         // SQL 層的 LIMIT/OFFSET
  .take(10).skip(20);            // ORM 層（處理 join 的正確性，較推薦）
```

### 結果方法

```typescript
await qb.getOne();              // T | null
await qb.getOneOrFail();
await qb.getMany();             // T[]
await qb.getCount();
await qb.getManyAndCount();     // [T[], number]
await qb.getRawOne();
await qb.getRawMany();
await qb.getRawAndEntities();   // { entities, raw }
qb.stream();                    // Readable stream

qb.getSql();                    // SQL 字串
qb.getQuery();
qb.getQueryAndParameters();     // [sql, params]
qb.printSql();                  // console log
```

### INSERT / UPDATE / DELETE QueryBuilder

```typescript
await ds.createQueryBuilder()
  .insert().into(User).values([{ name: 'a' }, { name: 'b' }])
  .returning(['id']).execute();

await ds.createQueryBuilder()
  .update(User).set({ age: () => '"age" + 1' })
  .where('id = :id', { id: 1 }).execute();

await ds.createQueryBuilder()
  .delete().from(User).where('active = false').execute();

await ds.createQueryBuilder()
  .softDelete().from(User).where('id = :id', { id: 1 }).execute();

// Upsert
await ds.createQueryBuilder()
  .insert().into(User).values([{ id: 1, name: 'a' }])
  .orUpdate(['name'], ['id']).execute();
```

### 子查詢

```typescript
qb.where('post.title IN ' + qb.subQuery()
  .select('u.name').from(User, 'u').getQuery());

qb.where((q) => {
  const sub = q.subQuery().select('u.name').from(User, 'u').getQuery();
  return 'post.title IN ' + sub;
});

// FROM subquery
ds.createQueryBuilder()
  .select('res.name').from((sub) => sub.select('u.name').from(User, 'u'), 'res');
```

### Locking

```typescript
qb.setLock('pessimistic_read');
qb.setLock('pessimistic_write');
qb.setLock('optimistic', existingUser.version);    // 需 @VersionColumn
qb.setLock('pessimistic_write', undefined, ['post']);  // 指定表
qb.setOnLocked('nowait');
qb.setOnLocked('skip_locked');
```

### CTE（Postgres）

```typescript
qb.addCommonTableExpression(`SELECT id FROM posts WHERE published = true`, 'pub_posts')
  .select().from('pub_posts', 'pp');
```

---

## Transactions

### DataSource.transaction（推薦）

```typescript
await ds.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(photo);
});

// 指定 isolation level
await ds.transaction('SERIALIZABLE', async (manager) => { /* ... */ });
// 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'
```

**關鍵**：transaction 內的 DB 操作**必須**使用 callback 提供的 `manager`，不可用外層的 `ds.manager` 或其他 repository，否則不會在同一交易內。

### 從 manager

```typescript
await ds.manager.transaction(async (txManager) => {
  await txManager.save(user);
});
```

### QueryRunner（手動控制）

```typescript
const qr = ds.createQueryRunner();
await qr.connect();
await qr.startTransaction();
try {
  await qr.manager.save(user);
  await qr.commitTransaction();
} catch (err) {
  await qr.rollbackTransaction();
  throw err;
} finally {
  await qr.release();
}
```

### DataSource 全域 isolation level

```typescript
new DataSource({ type: 'postgres', isolationLevel: 'SERIALIZABLE' });
```

---

## Migrations

### 建立 Migration

```bash
# 空白
npx typeorm migration:create src/migration/CreateUsersTable

# 基於 entity diff 自動生成
npx typeorm migration:generate -d src/data-source.ts src/migration/Init

# 執行
npx typeorm migration:run -d src/data-source.ts

# 回滾一步
npx typeorm migration:revert -d src/data-source.ts

# 顯示已執行狀態
npx typeorm migration:show -d src/data-source.ts
```

### MigrationInterface

```typescript
import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUsers1700000000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'serial', isPrimary: true },
        { name: 'email', type: 'varchar', length: '255', isUnique: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await qr.createIndex('users', new TableIndex({
      name: 'IDX_users_email',
      columnNames: ['email'],
    }));

    await qr.createForeignKey('photos', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable('users');
  }
}
```

### QueryRunner 常用方法

```typescript
// 表
qr.createTable(table, ifNotExist?)
qr.dropTable(tableOrName, ifExist?, dropForeignKeys?, dropIndices?)
qr.renameTable(oldName, newName)

// 欄位
qr.addColumn(table, column)
qr.dropColumn(table, columnName)
qr.renameColumn(table, oldName, newName)
qr.changeColumn(table, oldColumn, newColumn)

// Index / Unique / Check
qr.createIndex(table, index)
qr.dropIndex(table, name)
qr.createUniqueConstraint(table, constraint)
qr.createCheckConstraint(table, constraint)

// FK
qr.createForeignKey(table, fk)
qr.dropForeignKey(table, fk)

// Schema
qr.createSchema(schema, ifNotExist?)
qr.dropSchema(schemaPath, ifExist?, cascade?)

// Enum
qr.createEnum(table, column, values)

// 原生
qr.query(sql, params?)

// 交易
qr.startTransaction(level?)
qr.commitTransaction()
qr.rollbackTransaction()
```

---

## Listeners & Subscribers

### Entity Listener

```typescript
@Entity()
export class Post {
  @BeforeInsert() setCreatedAt() { this.createdAt = new Date(); }
  @AfterInsert() logInsert() { console.log('Inserted', this.id); }
  @BeforeUpdate() setUpdatedAt() { this.updatedAt = new Date(); }
  @AfterUpdate() logUpdate() {}
  @BeforeRemove() beforeRemove() {}
  @AfterRemove() afterRemove() {}
  @BeforeSoftRemove() beforeSoft() {}
  @AfterSoftRemove() afterSoft() {}
  @BeforeRecover() beforeRecover() {}
  @AfterRecover() afterRecover() {}
  @AfterLoad() afterLoad() {}
}
```

**限制**：Listener **不可做資料庫操作**，只能改自身資料。要做 DB 操作請用 Subscriber。

### Entity Subscriber

```typescript
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
  listenTo() { return Post; }  // 省略則監聽所有 entity

  beforeInsert(event: InsertEvent<Post>) {
    event.entity.slug = slugify(event.entity.title);
  }
  afterInsert(event: InsertEvent<Post>) {}
  beforeUpdate(event: UpdateEvent<Post>) {
    // 可存取 event.manager / event.queryRunner / event.connection
  }
  afterUpdate(event: UpdateEvent<Post>) {}
  beforeRemove(event: RemoveEvent<Post>) {}
  afterRemove(event: RemoveEvent<Post>) {}
  beforeSoftRemove(event: SoftRemoveEvent<Post>) {}
  afterSoftRemove(event: SoftRemoveEvent<Post>) {}
  beforeRecover(event: RecoverEvent<Post>) {}
  afterRecover(event: RecoverEvent<Post>) {}

  // Query hooks
  beforeQuery(event: QueryEvent) {}
  afterQuery(event: QueryEvent) {}

  // Transaction hooks
  beforeTransactionStart(event) {}
  afterTransactionStart(event) {}
  beforeTransactionCommit(event) {}
  afterTransactionCommit(event) {}
  beforeTransactionRollback(event) {}
  afterTransactionRollback(event) {}
}
```

註冊：`DataSource.subscribers = [PostSubscriber]`。

---

## NestJS 整合（@nestjs/typeorm）

### 安裝

```bash
npm i @nestjs/typeorm typeorm pg
```

### 基本設定

```typescript
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'secret',
      database: 'mydb',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

### async 設定（結合 @nestjs/config）

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    port: +config.get('DB_PORT'),
    username: config.get('DB_USER'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migration/*{.ts,.js}'],
    migrationsRun: true,
    synchronize: false,
  }),
});
```

### Feature Module（註冊 Repository）

```typescript
// users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User, Profile])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectEntityManager() private manager: EntityManager,
    @InjectDataSource() private ds: DataSource,
  ) {}
}
```

### 自訂 Repository（v0.3 寫法）

v0.3 棄用 `@EntityRepository`，改用 `extends Repository<T>`：

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(ds: DataSource) {
    super(User, ds.createEntityManager());
  }

  async findByEmail(email: string) {
    return this.findOneBy({ email });
  }
}

// 註冊
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UsersModule {}
```

### 多個 DataSource

```typescript
TypeOrmModule.forRoot({ name: 'default', /* ... */ })
TypeOrmModule.forRoot({ name: 'secondary', /* ... */ })

TypeOrmModule.forFeature([User], 'secondary');

@InjectRepository(User, 'secondary') private repo: Repository<User>;
@InjectDataSource('secondary') private ds: DataSource;
```

---

## 常見陷阱

1. **`synchronize: true` 不可上 production**：會自動改 schema，導致資料遺失。
2. **Entity constructor 必須可無參數呼叫**：ORM 用 `new Entity()` 建立實例後再填資料。
3. **保留字或底線欄名需在 @Column 顯式設定 name**。
4. **`save` vs `insert`**：save 會先試 find 再決定，帶 relations 處理；insert 純 insert，不觸發 listener/subscriber 中的 update 事件。
5. **transaction 必須用回 callback manager**：用外層 repo/manager 會跑在新連線上，破壞交易。
6. **Lazy relation 用 Promise 包**：`photos: Promise<Photo[]>`，必須 `await user.photos`。
7. **WHERE IN 陣列用 `:...`**：`:ids` 會被當成單一值，`:...ids` 才會展開。
8. **findOne 返回 null**（v0.3 以後），舊版會返回 undefined。
9. **Postgres enum 需用 migration 維護**：改動 enum 值要手動 `ALTER TYPE ... ADD VALUE`。
10. **v0.3 移除 `getManager()` / `getRepository()` 全域函式**：改用 `ds.manager` / `ds.getRepository()`。
