# 🦊 Elysia Decorators

A lightweight, zero-dependency decorator library for Elysia JS. It brings class-based architecture and NestJS-style routing to Elysia while maintaining type safety and compatibility with the Ecosystem.

**Features:**

- ✅ **Zero Dependencies**: Uses only native ES6+ and TypeScript features.
- ✅ **Full Elysia Support**: Support for Schemas, Details, Hooks, and Parameters.
- ✅ **Type Safe**: Leverages Elysia's `LocalHook` types for IntelliSense.
- ✅ **Elysia Plugin Pattern**: Returns a standard Elysia plugin for easy chaining (`app.use()`).
- ✅ **Runtime Validation**: Full schema validation using TypeBox.
- ✅ **Type Inference**: Extract TypeScript types from TypeBox schemas for type-safe handlers.

## Installation

```bash
# Bun
bun add @dockstat/elysia-decorators elysia

# npm
npm install @dockstat/elysia-decorators elysia

# pnpm
pnpm add @dockstat/elysia-decorators elysia

# yarn
yarn add @dockstat/elysia-decorators elysia
```

## Quick Start

Define your controllers using decorators and register them with the `controllers` plugin.

```typescript
import { Elysia } from 'elysia';
import { controllers, Get, Post, Group, Controller } from '@dockstat/elysia-decorators';

@Controller() // Mark class as a controller
@Group('/api') // Define a global prefix
export class AppController {

    @Get('/hello')
    hello() {
        return { message: 'Hello World' };
    }

    @Post('/echo')
    echo({ body }: { body: any }) {
        return body;
    }
}

const app = new Elysia()
    .use(controllers([AppController])) // Register controllers
    .listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);
```

## Type Safety

The library provides type safety by extracting TypeScript types from TypeBox schemas. **You must manually annotate types** in your handler parameters to enable full type safety.

### Recommended Approach: Type Extraction

Define schemas as constants and extract TypeScript types from them. This gives you a single source of truth with no duplication.

```typescript
import { Elysia, t, Static } from 'elysia';
import { Controller, Post, BodySchema, controllers } from '@dockstat/elysia-decorators';

// Define schema once
const CreateUserSchema = t.Object({
    username: t.String(),
    age: t.Number()
});

// Extract TypeScript type from schema
type CreateUserBody = Static<typeof CreateUserSchema>;

@Controller()
export class UserController {

    @Post('/create')
    @BodySchema(CreateUserSchema)
    async createUser({ body, set }: { 
        body: CreateUserBody;  // Type extracted from schema
        set: { status?: number }
    }) {
        // TypeScript knows body.username is string and body.age is number
        // Full autocomplete and type checking
        set.status = 201;

        console.log(`Creating user: ${body.username}, age: ${body.age}`);

        return { success: true };
    }
}
```

**Benefits:**

- ✅ Single source of truth (schema)
- ✅ No duplication (type extracted from schema)
- ✅ Full type safety (compile-time checking)
- ✅ Great IntelliSense (autocomplete)
- ✅ Easy to maintain (change schema, type updates automatically)

### Multiple Schema Decorators

```typescript
import { t, Static } from 'elysia';
import { Controller, Get, QuerySchema, BodySchema } from '@dockstat/elysia-decorators';

// Define all schemas
const QueryParamsSchema = t.Object({
    page: t.Optional(t.Number()),
    limit: t.Optional(t.Number())
});

const UserSchema = t.Object({
    name: t.String(),
    email: t.String()
});

// Extract all types
type QueryParams = Static<typeof QueryParamsSchema>;
type UserBody = Static<typeof UserSchema>;

@Controller()
export class UserController {

    @Get('/users')
    @QuerySchema(QueryParamsSchema)
    @BodySchema(UserSchema)
    async getUsers({ query, body }: { 
        query: QueryParams; 
        body: UserBody 
    }) {
        // Both query and body are fully typed
        return { 
            page: query.page || 1,
            name: body.name 
        };
    }
}
```

### Complex Schemas

```typescript
import { t, Static } from 'elysia';
import { Controller, Post, BodySchema } from '@dockstat/elysia-decorators';

const OrderSchema = t.Object({
    customerId: t.String(),
    items: t.Array(t.Object({
        productId: t.String(),
        quantity: t.Number(),
        price: t.Number()
    })),
    paymentMethod: t.Union([
        t.Literal('credit_card'),
        t.Literal('paypal'),
        t.Literal('bank_transfer')
    ])
});

type OrderBody = Static<typeof OrderSchema>;

@Controller()
export class OrderController {

    @Post('/create')
    @BodySchema(OrderSchema)
    async createOrder({ body }: { body: OrderBody }) {
        // TypeScript knows exact structure
        const total = body.items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        );

        // Type-safe: paymentMethod is 'credit_card' | 'paypal' | 'bank_transfer'
        const method = body.paymentMethod;

        return { orderId: 'ord_123', total, method };
    }
}
```

## Available Decorators

### Controller Decorators

| Decorator | Description | Usage |
|-----------|-------------|-------|
| `@Controller()` | Marks a class as a controller | `@Controller()` or `@Controller('/api')` or `@Controller({ prefix: '/api' })` |
| `@Group(prefix)` | Sets a path prefix for the entire class | `@Group('/api/v1')` |

### HTTP Method Decorators

| Decorator | Description |
|-----------|-------------|
| `@Get(path)` | Registers a GET route |
| `@Post(path)` | Registers a POST route |
| `@Put(path)` | Registers a PUT route |
| `@Patch(path)` | Registers a PATCH route |
| `@Delete(path)` | Registers a DELETE route |
| `@Options(path)` | Registers an OPTIONS route |

### Schema Decorators

Use TypeBox schemas to configure routes and extract types.

| Decorator | Configures | Type Extraction |
|-----------|------------|-----------------|
| `@BodySchema(schema)` | Request body validation | `type Body = Static<typeof schema>` |
| `@QuerySchema(schema)` | Query string validation | `type Query = Static<typeof schema>` |
| `@ParamsSchema(schema)` | URL parameters validation | `type Params = Static<typeof schema>` |
| `@HeadersSchema(schema)` | Headers validation | `type Headers = Static<typeof schema>` |
| `@CookieSchema(schema)` | Cookies validation | `type Cookie = Static<typeof schema>` |
| `@Response(status, schema)` | Response schema for a specific status code | `type Response = Static<typeof schema>` |

### Configuration Decorators

| Decorator | Description |
|-----------|-------------|
| `@Detail(object)` | OpenAPI/Swagger details (tags, description) |
| `@Options(config)` | Additional Elysia route configuration |

### Context Parameters

Your route handlers receive the full Elysia context as a single parameter. You can destructure only what you need:

```typescript
@Controller()
export class MyController {
    @Post('/route')
    async handler({ 
        body,      // from @BodySchema
        query,     // from @QuerySchema
        params,    // from @ParamsSchema
        headers,   // from @HeadersSchema
        cookie,    // from @CookieSchema
        set,       // Response setters
        request,   // Request object
        store      // Elysia store
    }: { 
        body: BodyType, 
        query: QueryType, 
        // ... other params with your types
    }) {
        // Your handler logic
    }
}
```

## Advanced Usage

### Multiple Controllers

```typescript
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { controllers } from '@dockstat/elysia-decorators';
import { UserController } from './controllers/UserController';
import { ProductController } from './controllers/ProductController';

const app = new Elysia()
    .use(swagger())
    .use(controllers([UserController, ProductController]))
    .listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);
console.log(`📚 Swagger docs at http://localhost:3000/swagger`);
```

### Controller Prefix Options

```typescript
// Option 1: Using @Controller with string
@Controller('/api/v1')
export class MyController {
    @Get('/users')
    // Full path: /api/v1/users
    getUsers() { ... }
}

// Option 2: Using @Controller with config object
@Controller({ prefix: '/api/v1' })
export class MyController2 {
    @Get('/users')
    // Full path: /api/v1/users
    getUsers() { ... }
}

// Option 3: Using @Group decorator
@Controller()
@Group('/api/v1')
export class MyController3 {
    @Get('/users')
    // Full path: /api/v1/users
    getUsers() { ... }
}
```

### Organizing Schemas

Keep your schemas in a separate file for better organization:

```typescript
// schemas/users.ts
import { t } from 'elysia';

export const CreateUserSchema = t.Object({
    username: t.String({ minLength: 2, maxLength: 100 }),
    email: t.String({ format: 'email' }),
    age: t.Optional(t.Number({ minimum: 0, maximum: 150 }))
});

export const UpdateUserSchema = t.Partial(CreateUserSchema);

export const UserIdSchema = t.Object({
    id: t.String({ format: 'uuid' })
});
```

```typescript
// controllers/user.controller.ts
import { t, Static } from 'elysia';
import { Controller, Post, Get, BodySchema, ParamsSchema } from '@dockstat/elysia-decorators';
import { CreateUserSchema, UpdateUserSchema, UserIdSchema } from '../schemas/users';

export type CreateUserBody = Static<typeof CreateUserSchema>;
export type UpdateUserBody = Static<typeof UpdateUserSchema>;
export type UserIdParams = Static<typeof UserIdSchema>;

@Controller()
export class UserController {

    @Post('/create')
    @BodySchema(CreateUserSchema)
    async createUser({ body }: { body: CreateUserBody }) {
        // Full type safety
    }

    @Get('/:id')
    @ParamsSchema(UserIdSchema)
    async getUser({ params }: { params: UserIdParams }) {
        // params.id is typed as string
    }
}
```

## Type Safety Documentation

For comprehensive information about type safety patterns and approaches, see:

- **[TYPESAFE_EXAMPLES.md](./TYPESAFE_EXAMPLES.md)** - Detailed guide with 5 different approaches to type safety, pros/cons of each, and best practices
- **[DECORATOR_TYPE_INFERENCE.md](./DECORATOR_TYPE_INFERENCE.md)** - Technical explanation of why automatic type inference from decorators isn't possible with current TypeScript, and what would be needed to enable it

## Migration Guide

### From Old Pattern (❌ Don't use)

**Old (BROKEN - Causes decorator errors):**

```typescript
export const MyController = Controller(class MyController {
    @Post('/route')
    async handler({ body }) { ... }
});
```

**New (✅ Use this):**

```typescript
@Controller()
export class MyController {
    @Post('/route')
    async handler({ body }: { body: BodyType }) { ... }
}
```

The old pattern wrapped the class in a function call, which caused TypeScript error "Decorators are not valid here. (ts 1206)". Use the new decorator pattern instead.

## Limitations

### Type Safety

**Manual type annotations are required:** Due to TypeScript decorator limitations (decorators run at runtime, not compile time), you must manually annotate handler parameters to get type safety. See [TYPESAFE_EXAMPLES.md](./TYPESAFE_EXAMPLES.md) for recommended patterns.

```typescript
// ❌ Without type annotation (no type safety)
@BodySchema(Schema)
async handler({ body }) { 
    // body is implicitly 'any'
}

// ✅ With type annotation (full type safety)
const Schema = t.Object({ name: t.String() });
type BodyType = Static<typeof Schema>;

@BodySchema(Schema)
async handler({ body }: { body: BodyType }) { 
    // body is fully typed
}
```

### Eden Treaty

Eden Treaty relies on static type inference. Since these decorators are runtime-based, Eden will **not** automatically detect the routes defined in these controllers for type-safe client calls. You would need to manually define types or generate them.

## API Reference

### Controller Decorator

```typescript
@Controller(prefixOrConfig?: string | { prefix?: string }): ClassDecorator
```

- `prefixOrConfig` (optional): Either a string prefix or a config object with a `prefix` property

### Method Decorators

```typescript
@Get(path: string): MethodDecorator
@Post(path: string): MethodDecorator
@Put(path: string): MethodDecorator
@Patch(path: string): MethodDecorator
@Delete(path: string): MethodDecorator
@Options(path: string): MethodDecorator
```

### Schema Decorators

```typescript
@BodySchema(schema: TSchema): MethodDecorator
@QuerySchema(schema: TSchema): MethodDecorator
@ParamsSchema(schema: TSchema): MethodDecorator
@HeadersSchema(schema: TSchema): MethodDecorator
@CookieSchema(schema: TSchema): MethodDecorator
@Response(status: number, schema: TSchema): MethodDecorator
```

### Other Decorators

```typescript
@Group(prefix: string): ClassDecorator
@Detail(detail: DocumentDecoration): MethodDecorator
@Options(config: LocalHook): MethodDecorator
```

### controllers Plugin

```typescript
function controllers<T extends Elysia>(Controllers: ControllerClass[]): (app: T) => T
```

Registers an array of controller classes with the Elysia app.

## Example Usage

```typescript
import { Elysia, t, Static } from 'elysia';
import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Group, 
    BodySchema, 
    QuerySchema, 
    ParamsSchema, 
    Detail, 
    Response,
    controllers 
} from '@dockstat/elysia-decorators';

// Define schemas
const UserSchema = t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String()
});

const CreateUserSchema = t.Object({
    name: t.String({ minLength: 2 }),
    email: t.String({ format: 'email' })
});

// Extract types
type UserBody = Static<typeof UserSchema>;
type CreateUserBody = Static<typeof CreateUserSchema>;
type UserParams = Static<typeof t.Object({ id: t.String() })>;

@Controller()
@Group('/users')
export class UserController {

    @Get('/')
    @Detail({ tags: ['Users'], description: 'Get all users' })
    @QuerySchema(t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number())
    }))
    async getUsers({ query }: { 
        query: { page?: number; limit?: number } 
    }) {
        const page = query.page || 1;
        const limit = query.limit || 10;

        return { 
            users: [], 
            pagination: { page, limit, total: 0 } 
        };
    }

    @Get('/:id')
    @Detail({ tags: ['Users'], description: 'Get user by ID' })
    @ParamsSchema(t.Object({ id: t.String() }))
    @Response(200, UserSchema)
    @Response(404, t.Object({ error: t.String() }))
    async getUser({ params }: { params: UserParams }) {
        // params.id is typed as string
        return { id: params.id, name: 'John', email: 'john@example.com' };
    }

    @Post('/')
    @Detail({ tags: ['Users'], description: 'Create user' })
    @BodySchema(CreateUserSchema)
    @Response(201, t.Object({ success: t.Boolean(), id: t.String() }))
    async createUser({ body, set }: { 
        body: CreateUserBody;
        set: { status?: number };
    }) {
        set.status = 201;

        return { 
            success: true, 
            id: 'user_123' 
        };
    }

    @Put('/:id')
    @Detail({ tags: ['Users'], description: 'Update user' })
    @ParamsSchema(t.Object({ id: t.String() }))
    @BodySchema(t.Partial(UserSchema))
    async updateUser({ params, body }: { 
        params: UserParams;
        body: Partial<UserBody>;
    }) {
        return { 
            id: params.id, 
            ...body 
        };
    }

    @Delete('/:id')
    @Detail({ tags: ['Users'], description: 'Delete user' })
    @ParamsSchema(t.Object({ id: t.String() }))
    @Response(204)
    async deleteUser({ params, set }: { 
        params: UserParams;
        set: { status?: number };
    }) {
        set.status = 204;
    }
}

const app = new Elysia()
    .use(controllers([UserController]))
    .listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);
```

## License

MIT

