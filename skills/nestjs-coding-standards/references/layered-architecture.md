# 分層架構：Controller / Service / Repository

## 各層職責

| 層 | 職責 | 禁止 |
|----|------|------|
| **Controller** | 接收請求、驗證 DTO、呼叫 Service、回應 | 業務邏輯、資料庫操作、複雜條件分支 |
| **Service** | 業務邏輯、協調多個 Repository、處理交易 | HTTP 細節、SQL 查詢、ORM 直接操作 |
| **Repository** | 資料存取、封裝 ORM 操作、資料模型轉換 | 業務規則、HTTP 回應、跨 entity 業務流程 |

---

## 完整範例：Orders feature

### Controller

```typescript
// orders/orders.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '列出目前使用者的訂單' })
  list(
    @CurrentUser('id') userId: number,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.ordersService.listByUser(userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findForUser(userId, id);
  }

  @Post()
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, dto);
  }

  @Delete(':id')
  cancel(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.cancel(userId, id);
  }
}
```

### Service

```typescript
// orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { UsersRepository } from '@/users/users.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { Order } from './entities/order.entity';
import {
  OrderNotFoundException,
  InsufficientCreditException,
} from './exceptions';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async listByUser(userId: number, query: ListOrdersQueryDto) {
    return this.ordersRepo.findByUserPaginated(userId, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      status: query.status,
    });
  }

  async findForUser(userId: number, id: number): Promise<Order> {
    const order = await this.ordersRepo.findById(id);
    if (!order || order.userId !== userId) {
      throw new OrderNotFoundException(id);
    }
    return order;
  }

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new OrderNotFoundException(userId);

    const total = this.calculateTotal(dto.items);
    if (user.credit < total) {
      throw new InsufficientCreditException(total, user.credit);
    }

    return this.ordersRepo.create({
      userId,
      total,
      items: dto.items,
      status: 'pending',
    });
  }

  async cancel(userId: number, id: number): Promise<Order> {
    const order = await this.findForUser(userId, id);
    return this.ordersRepo.update(order.id, { status: 'cancelled' });
  }

  private calculateTotal(items: { price: number; quantity: number }[]): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
}
```

### Repository（TypeORM 版）

```typescript
// orders/orders.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

interface PaginationParams {
  page: number;
  pageSize: number;
  status?: string;
}

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  findById(id: number): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async findByUserPaginated(userId: number, params: PaginationParams) {
    const qb = this.repo
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId });

    if (params.status) {
      qb.andWhere('order.status = :status', { status: params.status });
    }

    const [items, total] = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  create(data: Partial<Order>): Promise<Order> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Order>): Promise<Order> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
```

### Repository（Prisma 版）

```typescript
// orders/orders.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Order } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findByUserPaginated(userId: number, params: { page: number; pageSize: number; status?: string }) {
    const where: Prisma.OrderWhereInput = {
      userId,
      ...(params.status && { status: params.status }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  create(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({ data });
  }

  update(id: number, data: Prisma.OrderUpdateInput): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data });
  }
}
```

---

## Module 組裝

```typescript
// orders/orders.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    UsersModule, // 需要 UsersRepository
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService], // 若其他 Module 需要
})
export class OrdersModule {}
```

---

## Transaction 處理

### TypeORM

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ordersRepo: OrdersRepository,
  ) {}

  async createWithPayment(userId: number, dto: CreateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).save({...});
      const payment = await manager.getRepository(Payment).save({...});
      return order;
    });
  }
}
```

### Prisma

```typescript
async createWithPayment(userId: number, dto: CreateOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.create({...});
    await tx.payment.create({...});
    return order;
  });
}
```

---

## 常見反模式

- ❌ Controller 直接注入 Repository（跳過 Service 層）
- ❌ Service 直接使用 `DataSource.query()` 寫 raw SQL
- ❌ Repository 內含業務規則（如「若 credit 不足就拋例外」）
- ❌ 跨 Feature 直接 `import` 其他 Module 的 Repository（應透過該 Module 的 Service）
- ❌ 在 Controller 內組裝複雜的 where 條件（應在 Service 或 Repository）
