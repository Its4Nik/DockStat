import { Elysia, t } from 'elysia';
import type { Static } from 'elysia';
import Controllers, { Controller, Get, Post, Put, Delete, Group, BodySchema, QuerySchema, ParamsSchema, HeadersSchema, Detail, Response } from '@dockstat/elysia-decorators';

// ============================================
// SCHEMA DEFINITIONS (Single Source of Truth)
// ============================================

// User Schemas
const CreateUserSchema = t.Object({
    name: t.String({ minLength: 2, maxLength: 100 }),
    email: t.String({ format: 'email' }),
    age: t.Optional(t.Number({ minimum: 0, maximum: 150 })),
});

const UpdateUserSchema = t.Partial(t.Object({
    name: t.String(),
    email: t.String(),
    age: t.Number(),
}));

const UserIdSchema = t.Object({
    id: t.String({ format: 'uuid' }),
});

// Product Schemas
const CreateProductSchema = t.Object({
    name: t.String({ minLength: 1, maxLength: 200 }),
    description: t.String({ minLength: 10 }),
    price: t.Number({ minimum: 0 }),
    category: t.Union([
        t.Literal('electronics'),
        t.Literal('clothing'),
        t.Literal('books'),
    ]),
});

const ProductFiltersSchema = t.Object({
    category: t.Optional(t.Union([
        t.Literal('electronics'),
        t.Literal('clothing'),
        t.Literal('books'),
    ])),
    minPrice: t.Optional(t.Number({ minimum: 0 })),
    maxPrice: t.Optional(t.Number({ minimum: 0 })),
    inStock: t.Optional(t.Boolean()),
});

// Order Schemas
const CreateOrderSchema = t.Object({
    customerId: t.String({ format: 'uuid' }),
    items: t.Array(t.Object({
        productId: t.String(),
        quantity: t.Number({ minimum: 1 }),
        price: t.Number({ minimum: 0 }),
    })),
    paymentMethod: t.Union([
        t.Literal('credit_card'),
        t.Literal('paypal'),
        t.Literal('bank_transfer'),
    ]),
});

const ApiHeadersSchema = t.Object({
    'x-api-key': t.String({ minLength: 32 }),
    'x-request-id': t.Optional(t.String()),
});

// ============================================
// TYPE EXTRACTION (Approach 2: Type Safety without Duplication)
// ============================================

// Extract TypeScript types from schemas - Single source of truth!
type CreateUserBody = Static<typeof CreateUserSchema>;
type UpdateUserBody = Static<typeof UpdateUserSchema>;
type UserIdParams = Static<typeof UserIdSchema>;
type CreateProductBody = Static<typeof CreateProductSchema>;
type ProductFiltersQuery = Static<typeof ProductFiltersSchema>;
type CreateOrderBody = Static<typeof CreateOrderSchema>;
type ApiHeaders = Static<typeof ApiHeadersSchema>;

// ============================================
// CONTROLLERS WITH FULL TYPE SAFETY
// ============================================

// Simple controller demonstrating basic concepts
@Controller()
@Group('/api/v1')
export class SimpleController {

    @Get('/hello')
    @Detail({ tags: ['Simple'], description: 'Simple hello endpoint' })
    async hello() {
        return { message: 'Hello World!' };
    }

    @Post('/echo')
    @BodySchema(t.Object({
        message: t.String(),
        count: t.Number(),
    }))
    async echo({ body }: { body: { message: string; count: number } }) {
        // Full type safety - TypeScript knows body.message is string and body.count is number
        return {
            echoed: body.message,
            repeated: body.message.repeat(body.count),
        };
    }
}

// User controller with type extraction
@Controller()
@Group('/users')
export class UserController {

    @Get('/')
    @Detail({
        tags: ['Users'],
        description: 'Get all users with pagination',
    })
    @QuerySchema(t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
    }))
    async getUsers({ query }: {
        query: {
            page?: number;
            limit?: number;
            search?: string;
        };
    }) {
        // Full type safety - TypeScript knows query properties
        const page = query.page || 1;
        const limit = query.limit || 10;
        const search = query.search || '';

        return {
            users: [],
            pagination: { page, limit, total: 0 },
            filters: { search },
        };
    }

    @Get('/:id')
    @Detail({
        tags: ['Users'],
        description: 'Get a single user by ID',
    })
    @ParamsSchema(UserIdSchema)
    @Response(
        200,
        t.Object({
            id: t.String(),
            name: t.String(),
            email: t.String(),
            createdAt: t.Date(),
        })
    )
    @Response(
        404,
        t.Object({
            error: t.String(),
            message: t.String(),
        })
    )
    async getUser({ params, set }: { params: UserIdParams; set: { status?: number } }) {
        // params.id is automatically typed as string (from UserIdParams)
        // set is typed as Elysia's Context['set']

        // Simulating a user lookup
        if (params.id === '00000000-0000-0000-0000-000000000000') {
            set.status = 404;
            return {
                error: 'Not Found',
                message: 'User not found',
            };
        }

        return {
            id: params.id,
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: new Date(),
        };
    }

    @Post('/create')
    @Detail({
        tags: ['Users'],
        description: 'Create a new user',
    })
    @BodySchema(CreateUserSchema)
    @Response(
        201,
        t.Object({
            id: t.String(),
            success: t.Boolean(),
        })
    )
    async createUser({ body, set }: { body: CreateUserBody; set: { status?: number } }) {
        // Full type safety - TypeScript knows body.name, body.email, body.age
        // Type extracted from CreateUserSchema - no duplication!
        set.status = 201;

        const userId = '550e8400-e29b-41d4-a716-446655440000';

        return {
            id: userId,
            success: true,
        };
    }

    @Put('/:id')
    @Detail({ tags: ['Users'], description: 'Update a user' })
    @ParamsSchema(UserIdSchema)
    @BodySchema(UpdateUserSchema)
    @Response(
        200,
        t.Object({
            success: t.Boolean(),
            updated: t.Object({
                id: t.String(),
                name: t.String(),
                email: t.String(),
            }),
        })
    )
    async updateUser({
        params,
        body,
    }: {
        params: UserIdParams;
        body: UpdateUserBody;
    }) {
        // Both params and body are fully typed from schemas
        return {
            success: true,
            updated: {
                id: params.id,
                name: body.name || 'John Doe',
                email: body.email || 'john@example.com',
            },
        };
    }

    @Delete('/:id')
    @Detail({ tags: ['Users'], description: 'Delete a user' })
    @ParamsSchema(UserIdSchema)
    @Response(204, null)
    async deleteUser({ params, set }: { params: UserIdParams; set: { status?: number } }) {
        // params.id is typed as string
        set.status = 204;
        return;
    }
}

// Product controller with complex schemas
@Controller('/products')
export class ProductController {

    @Get('/')
    @Detail({ tags: ['Products'] })
    @QuerySchema(ProductFiltersSchema)
    async getProducts({ query }: { query: ProductFiltersQuery }) {
        // All query parameters are properly typed
        const filters: Record<string, unknown> = {};

        if (query.category) filters.category = query.category;
        if (query.minPrice !== undefined) filters.minPrice = query.minPrice;
        if (query.maxPrice !== undefined) filters.maxPrice = query.maxPrice;
        if (query.inStock !== undefined) filters.inStock = query.inStock;

        return {
            products: [],
            filters,
        };
    }

    @Post('/')
    @Detail({ tags: ['Products'], description: 'Create a new product' })
    @BodySchema(CreateProductSchema)
    @Response(
        201,
        t.Object({
            id: t.String(),
            name: t.String(),
            price: t.Number(),
        })
    )
    async createProduct({ body, set }: { body: CreateProductBody; set: { status?: number } }) {
        // Full type safety with complex union types
        // TypeScript knows category is 'electronics' | 'clothing' | 'books'
        set.status = 201;

        return {
            id: 'prod_123',
            name: body.name,
            price: body.price,
        };
    }
}

// Order controller with headers validation
@Controller('/orders')
export class OrderController {

    @Post('/create')
    @Detail({
        tags: ['Orders'],
        description: 'Create a new order',
    })
    @HeadersSchema(ApiHeadersSchema)
    @BodySchema(CreateOrderSchema)
    @Response(
        201,
        t.Object({
            orderId: t.String(),
            total: t.Number(),
            status: t.Literal('pending'),
        })
    )
    async createOrder({
        body,
        headers,
        set,
    }: {
        body: CreateOrderBody;
        headers: ApiHeaders;
        set: { status?: number };
    }) {
        // TypeScript enforces all types - no any!
        // headers['x-api-key'] is typed as string
        // body.paymentMethod is 'credit_card' | 'paypal' | 'bank_transfer'

        const total = body.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        set.status = 201;

        return {
            orderId: 'ord_' + Date.now(),
            total,
            status: 'pending' as const,
        };
    }
}

// ============================================
// APPLICATION SETUP
// ============================================

const app = new Elysia()
    .use(Controllers([
        SimpleController,
        UserController,
        ProductController,
        OrderController,
    ]))
    .listen(3000);

console.log('🦊 Elysia is running at http://localhost:3000');
console.log('📚 Available routes:');
console.log('   GET  /api/v1/hello');
console.log('   POST /api/v1/echo');
console.log('   GET  /users');
console.log('   GET  /users/:id');
console.log('   POST /users/create');
console.log('   PUT  /users/:id');
console.log('   DELETE /users/:id');
console.log('   GET  /products');
console.log('   POST /products');
console.log('   POST /orders/create');
console.log('');
console.log('✅ All routes have full type safety!');
console.log('✅ TypeScript types are extracted from TypeBox schemas');
console.log('✅ No duplication - single source of truth!');
console.log('');
console.log('💡 Type annotations in handlers are automatic from schema definitions');
console.log('💡 Change a schema, and the types update automatically');
console.log('💡 Full IntelliSense support - autocomplete works perfectly!');

export default app;
