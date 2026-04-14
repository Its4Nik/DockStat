# Type Safety with @elysia-decorators

## The Challenge

TypeScript decorators work at **runtime**, not at compile time. This means TypeScript cannot automatically infer types from decorators like `@BodySchema()`. When you write:

```typescript
@BodySchema(t.Object({ username: t.String(), age: t.Number() }))
async handler({ body }) {  // No type annotation
    // TypeScript infers `body` as `any`
}
```

TypeScript has no way to know that `body` should be typed as `{ username: string; age: number }` because the decorator only stores the schema at runtime.

## Solutions

We provide multiple approaches to achieve type safety, each with different tradeoffs.

---

## Approach 1: Explicit Type Annotations (Recommended)

Define the type manually based on your schema. This gives you **full type safety** and works perfectly with TypeScript's type system.

```typescript
import { Controller, Post, BodySchema, Detail, Response, controllers } from '@dockstat/elysia-decorators';
import { t } from 'elysia';

// Define the body type (matches your TypeBox schema)
type CreateUserBody = {
    username: string;
    age: number;
};

@Controller()
export class UserController {

    @Post('/create')
    @Detail({ tags: ['Users'] })
    @BodySchema(t.Object({
        username: t.String(),
        age: t.Number()
    }))
    @Response(201, t.Object({ success: t.Boolean() }))
    async createUser({ body, set }: { 
        body: CreateUserBody;  // Explicit type annotation
        set: { status?: number }
    }) {
        // Full type safety - TypeScript knows body.username and body.age
        set.status = 201;

        console.log(`Creating user: ${body.username}, age: ${body.age}`);

        return { success: true };
    }
}
```

### Pros

- ✅ **Full type safety** - TypeScript knows all properties
- ✅ **Compile-time checking** - Errors caught before runtime
- ✅ **Great IntelliSense** - Autocomplete works perfectly
- ✅ **Works with all TypeScript features** - Type narrowing, unions, etc.

### Cons

- ❌ Requires maintaining type definitions alongside schemas
- ❌ Slight duplication (type + schema)

---

## Approach 2: Type Extraction Helpers

Use helper types to extract TypeScript types from TypeBox schemas. This reduces duplication.

```typescript
import { Controller, Post, BodySchema, Detail, controllers } from '@dockstat/elysia-decorators';
import { t, Static } from 'elysia';

// Define the schema once
const CreateUserSchema = t.Object({
    username: t.String(),
    age: t.Number()
});

// Extract the TypeScript type from the schema
type CreateUserBody = Static<typeof CreateUserSchema>;

@Controller()
export class UserController {

    @Post('/create')
    @Detail({ tags: ['Users'] })
    @BodySchema(CreateUserSchema)
    async createUser({ body }: { body: CreateUserBody }) {
        // body is typed as { username: string; age: number }
        return { success: true };
    }
}
```

### Pros

- ✅ **Full type safety**
- ✅ **No duplication** - Single source of truth
- ✅ **Easy to maintain** - Change schema, type updates automatically

### Cons

- ❌ Still requires manual type annotation on handler
- ❌ Need to define schemas as constants (not inline)

---

## Approach 3: TypedHandlerContext (Convenient)

Use the `TypedHandlerContext` type alias as a convenience. This provides a standard shape but **no strict type safety**.

```typescript
import { Controller, Post, BodySchema, Detail, controllers, TypedHandlerContext } from '@dockstat/elysia-decorators';
import { t } from 'elysia';

@Controller()
export class UserController {

    @Post('/create')
    @Detail({ tags: ['Users'] })
    @BodySchema(t.Object({
        username: t.String(),
        age: t.Number()
    }))
    async createUser({ body, set }: TypedHandlerContext) {
        // body is typed as `any` (no strict type safety)
        // set is typed with standard Elysia types
        // Runtime validation still occurs, but no compile-time checking

        set.status = 201;  // ✅ Works

        // TypeScript won't catch this error:
        console.log(`Creating user: ${body.username}, age: ${body.invalidProperty}`);

        return { success: true };
    }
}
```

### Pros

- ✅ **Convenient** - Single type alias to import
- ✅ **Consistent shape** - All handlers have same context structure
- ✅ **Runtime validation** - Elysia still validates at runtime

### Cons

- ❌ **No compile-time type safety** - Parameters typed as `any`
- ❌ **No IntelliSense** - Editor can't suggest properties
- ❌ **Errors caught only at runtime** - Not ideal for production

**Use this only when:** Quick prototyping, MVPs, or when you trust runtime validation.

---

## Approach 4: typedRoute Helper (Type-Safe)

Use the `typedRoute` helper with explicit configuration types. This provides **full type safety** with a different API.

```typescript
import { Controller, Post, BodySchema, Detail, controllers, typedRoute } from '@dockstat/elysia-decorators';
import { t } from 'elysia';

// Define the configuration type
type CreateUserConfig = {
    body: {
        username: string;
        age: number;
    };
    response: {
        success: boolean;
    };
};

@Controller()
export class UserController {

    @Post('/create')
    @Detail({ tags: ['Users'] })
    @BodySchema(t.Object({
        username: t.String(),
        age: t.Number()
    }))
    // Use typedRoute instead of async method
    createUser = typedRoute<CreateUserConfig>(({ body, set }) => {
        // Full type safety - TypeScript knows exact types
        set.status = 201;

        console.log(`Creating user: ${body.username}, age: ${body.age}`);

        return { success: true };
    });
}
```

### Pros

- ✅ **Full type safety**
- ✅ **No manual type annotations** on the handler function
- ✅ **Clean syntax** - Handler body focuses on logic

### Cons

- ❌ **Different API** - Methods become properties with arrow functions
- ❌ **Still requires config type** - Need to maintain configuration type
- ❌ **Duplication** - Schema in decorator, type in generic

---

## Approach 5: Config Type Factories (Most Type-Safe)

Create reusable configuration types and use them across multiple routes.

```typescript
import { Controller, Get, Post, BodySchema, QuerySchema, controllers, typedRouteFactory } from '@dockstat/elysia-decorators';
import { t } from 'elysia';

// Define common configuration types
type ApiHeadersConfig = {
    headers: {
        'x-api-key': string;
        'x-request-id'?: string;
    };
};

type PaginationConfig = {
    query: {
        page?: number;
        limit?: number;
    };
};

// Create typed route factories with common configs
const withApiAuth = typedRouteFactory<ApiHeadersConfig>();
const withPagination = typedRouteFactory<PaginationConfig>();

@Controller()
export class ApiController {

    @Get('/users')
    @HeadersSchema(t.Object({
        'x-api-key': t.String(),
        'x-request-id': t.Optional(t.String())
    }))
    @QuerySchema(t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number())
    }))
    getUsers = withApiAuth(({ headers, query }) => {
        // headers is fully typed with x-api-key and x-request-id
        // query is fully typed with page and limit

        const apiKey = headers['x-api-key'];
        const page = query.page || 1;
        const limit = query.limit || 10;

        return { users: [], page, limit };
    });
}
```

### Pros

- ✅ **Full type safety**
- ✅ **Reusable** - Common configs across multiple routes
- ✅ **DRY** - Define once, use everywhere
- ✅ **Consistent** - All routes have same structure

### Cons

- ❌ **More setup** - Need to define config types first
- ❌ **Different API** - Uses factory pattern
- ❌ **Learning curve** - More complex than simple decorators

---

## Best Practices

### 1. Choose Based on Project Size

**Small Projects / Prototyping:**

```typescript
// Use Approach 1 (Explicit Types) - Quick and clear
@BodySchema(t.Object({ name: t.String() }))
async handler({ body }: { body: { name: string } }) { ... }
```

**Medium Projects:**

```typescript
// Use Approach 2 (Type Extraction) - DRY and type-safe
const Schema = t.Object({ name: t.String() });
type BodyType = Static<typeof Schema>;
@BodySchema(Schema)
async handler({ body }: { body: BodyType }) { ... }
```

**Large Projects / Production:**

```typescript
// Use Approach 5 (Config Factories) - Maximum reusability and type safety
type CommonConfig = { headers: { 'x-api-key': string } };
const withCommon = typedRouteFactory<CommonConfig>();
@HeadersSchema(...)
handler = withCommon(({ headers }) => { ... });
```

### 2. Organization

Put your schemas in a separate file to keep things organized:

```typescript
// schemas/users.ts
import { t } from 'elysia';

export const CreateUserSchema = t.Object({
    username: t.String(),
    age: t.Number()
});

export const UpdateUserSchema = t.Partial(t.Object({
    username: t.String(),
    age: t.Number()
}));

// Extract types
export type CreateUserBody = Static<typeof CreateUserSchema>;
export type UpdateUserBody = Static<typeof UpdateUserSchema>;
```

```typescript
// controllers/user.controller.ts
import { Controller, Post, BodySchema } from '@dockstat/elysia-decorators';
import { CreateUserSchema, CreateUserBody } from '../schemas/users';

@Controller()
export class UserController {
    @Post('/create')
    @BodySchema(CreateUserSchema)
    async createUser({ body }: { body: CreateUserBody }) {
        // Full type safety, no duplication
    }
}
```

### 3. Validation vs Types

Remember: **Validation happens at runtime, Types are compile-time**.

```typescript
@BodySchema(t.Object({
    age: t.Number({ minimum: 0, maximum: 150 })
}))
async handler({ body }: { body: { age: number } }) {
    // TypeScript knows `age` is a number (compile-time)
    // Elysia validates age is between 0-150 (runtime)
    // Both layers work together!
}
```

### 4. Use Union Types for Complex Schemas

```typescript
@BodySchema(t.Union([
    t.Literal('admin'),
    t.Literal('user'),
    t.Literal('guest')
]))
async handler({ body }: { body: 'admin' | 'user' | 'guest' }) {
    if (body === 'admin') {
        // TypeScript knows body is 'admin' here
    }
}
```

### 5. Document Complex Types

```typescript
/**
 * User creation request body
 * @property username - Must be 2-100 characters
 * @property age - Must be between 0-150
 */
type CreateUserBody = {
    username: string;
    age: number;
};
```

---

## Migration Guide

### From Old Pattern (Controller Wrapper)

**Old (BROKEN - Causes decorator errors):**

```typescript
export const UserController = Controller(class UserController {
    @Post('/create')
    @BodySchema(t.Object({ username: t.String() }))
    async handler({ body }: any) { ... }
});
```

**New (FIXED - Use class decorator):**

```typescript
@Controller()
export class UserController {
    @Post('/create')
    @BodySchema(t.Object({ username: t.String() }))
    async handler({ body }: { body: { username: string } }) { ... }
}
```

### From No Type Safety

**Old:**

```typescript
@Post('/create')
@BodySchema(t.Object({ username: t.String() }))
async handler({ body }: any) {  // No type safety
    body.username.toUpperCase();  // No autocomplete, no errors
}
```

**New:**

```typescript
@Post('/create')
@BodySchema(t.Object({ username: t.String() }))
async handler({ body }: { body: { username: string } }) {  // Type safe
    body.username.toUpperCase();  // Autocomplete, type checking
}
```

---

## Summary Table

| Approach | Type Safety | Convenience | Duplicates Schema | Best For |
|----------|-------------|-------------|-------------------|----------|
| Explicit Types | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Yes | Most projects |
| Type Extraction | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | No | Medium+ projects |
| TypedHandlerContext | ⭐ | ⭐⭐⭐⭐⭐ | No | Prototyping |
| typedRoute Helper | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Yes | Functional style |
| Config Factories | ⭐⭐⭐⭐⭐ | ⭐⭐ | No | Large projects |

---

## Recommendations

1. **Start with Approach 2 (Type Extraction)** - Best balance of type safety and convenience
2. **Use Approach 5 (Config Factories)** for large codebases with common patterns
3. **Avoid Approach 3 (TypedHandlerContext)** in production - no compile-time safety
4. **Always define schemas as constants** when using TypeBox types
5. **Use Approach 1 (Explicit Types)** for simple, straightforward cases

---

## Common Issues & Solutions

### Issue: "Property does not exist on type 'any'"

**Problem:**

```typescript
async handler({ body }: TypedHandlerContext) {
    body.username;  // Error: Property 'username' does not exist on type 'any'
}
```

**Solution:**

```typescript
// Use explicit types
async handler({ body }: { body: { username: string } }) {
    body.username;  // ✅ Works
}
```

### Issue: "Schema doesn't match type"

**Problem:**

```typescript
const Schema = t.Object({ age: t.Number() });
type Body = { name: string };  // Mismatch!

@BodySchema(Schema)
async handler({ body }: { body: Body }) { ... }
```

**Solution:**

```typescript
const Schema = t.Object({ age: t.Number() });
type Body = Static<typeof Schema>;  // Extract from schema

@BodySchema(Schema)
async handler({ body }: { body: Body }) { ... }  // ✅ Matches
```

### Issue: Want both type safety AND runtime validation

**Solution:** Use both TypeBox schemas AND TypeScript types. They work together!

```typescript
const Schema = t.Object({ age: t.Number({ minimum: 0 }) });
type Body = Static<typeof Schema>;

@BodySchema(Schema)
async handler({ body }: { body: Body }) {
    // TypeScript: Knows age is a number
    // Elysia: Validates age >= 0 at runtime
    // Best of both worlds!
}
```

---

## Conclusion

The @elysia-decorators package provides multiple ways to achieve type safety. Choose the approach that best fits your project's needs:

- **Quick prototyping**: Use `TypedHandlerContext` with runtime validation
- **Most projects**: Use explicit types or type extraction (Approaches 1 & 2)
- **Large codebases**: Use config factories (Approach 5)

Remember: TypeScript types provide **compile-time safety**, while Elysia schemas provide **runtime validation**. Using both together gives you the best developer experience and most robust applications.

Happy coding! 🚀
