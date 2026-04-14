# Decorator Type Inference in @elysia-decorators

## The Dream

You want to write:

```typescript
import { t } from 'elysia';
import { Controller, Post, BodySchema } from '@dockstat/elysia-decorators';

const UserSchema = t.Object({
  username: t.String(),
  age: t.Number()
});

@Controller()
export class UserController {
  @Post('/create')
  @BodySchema(UserSchema)
  async createUser({ body }) {
    // body should automatically be { username: string, age: number }
    console.log(body.username);  // Should work with autocomplete
    return body.age + 1;
  }
}
```

**No type annotation**, yet TypeScript magically knows that `body` is `{ username: string, age: number }` because of the `@BodySchema(UserSchema)` decorator above it.

## The Reality

This **doesn't work** with the current implementation, and here's why.

## Why Automatic Type Inference Isn't Possible (Yet)

### 1. TypeScript Decorator Fundamentals

TypeScript decorators work at **runtime**, not at compile time. When you write:

```typescript
@BodySchema(UserSchema)
async handler({ body }) { ... }
```

The decorator executes when your code runs, not when TypeScript compiles it. TypeScript cannot access the decorator's runtime metadata (the UserSchema stored in a WeakMap) during compilation.

### 2. Old vs New Decorator Patterns

The project is configured with:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

This uses the **old decorator pattern** (Stage 1), which has this signature:

```typescript
function decorator(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void | PropertyDescriptor
```

The decorator can:

- Modify the method descriptor (add validation at runtime)
- Store metadata in WeakMaps (for Elysia to use)

But it **cannot** modify the method's TypeScript signature.

### 3. What Would Make It Work

To enable automatic type inference from decorators, you'd need:

**A. New Decorator Proposal (Stage 3):**

```typescript
// New decorator syntax (not yet stable)
function BodySchema<Schema extends TSchema>(schema: Schema) {
  return function<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ): (this: This, ...args: Args) => Return {
    // Can return modified function with new signature
    return modifiedFunction;
  };
}
```

**B. TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,        // ✓ Already set
    "decoratorMetadata": true,            // ✗ Missing
    "emitDecoratorMetadata": true,        // ✗ Not needed for this
    "target": "ES2022",                  // Might need upgrade
    "lib": ["ESNext", "DecoratorMetadata"] // Missing
  }
}
```

**C. Breaking Changes:**

- The decorator would need to return a **new function** with a modified signature
- This changes how methods are registered at runtime
- Elysia's `controllers` function would need updates
- TypeScript support for this is still experimental

### 4. The Fundamental Limitation

Even with new decorators, there's a deeper issue:

```typescript
@BodySchema(UserSchema)
async handler({ body }) { ... }
```

The method receives a **full Elysia context**:

```typescript
{
  body: unknown,
  query: unknown,
  params: unknown,
  headers: unknown,
  set: { ... },
  request: Request,
  store: Record<string, unknown>
}
```

The decorator needs to somehow tell TypeScript: *"When this method destructures `{ body }` from the context, the `body` variable should have type `Static<typeof UserSchema>`."*

But decorators can't see how the method will destructures the context. The decorator operates on the method before it's called, so it can't know what properties will be extracted.

## What Actually Works

### Option 1: Manual Type Annotation (Recommended)

```typescript
import { t, Static } from 'elysia';

const UserSchema = t.Object({
  username: t.String(),
  age: t.Number()
});

// Extract type from schema
type UserBody = Static<typeof UserSchema>;

@Controller()
export class UserController {
  @Post('/create')
  @BodySchema(UserSchema)
  async createUser({ body }: { body: UserBody }) {
    // body is typed as { username: string, age: number }
    console.log(body.username);  // ✅ Autocomplete works
    return body.age + 1;  // ✅ Type checking works
  }
}
```

**Pros:**

- ✅ Full type safety
- ✅ No runtime overhead
- ✅ Works with all TypeScript features
- ✅ Clear and explicit

**Cons:**

- ❌ Requires manual type annotation
- ❌ Slight duplication (schema + type)

**When to use:** Most projects. Best balance of type safety and clarity.

### Option 2: Property Wrapper Pattern

```typescript
import { t, Static } from 'elysia';
import { typedRoute } from '@dockstat/elysia-decorators';

const UserSchema = t.Object({
  username: t.String(),
  age: t.Number()
});

type UserBody = Static<typeof UserSchema>;
type CreateUserConfig = { body: UserBody };

@Controller()
export class UserController {
  @Post('/create')
  @BodySchema(UserSchema)
  createUser = typedRoute<CreateUserConfig>(({ body, set }) => {
    // body is automatically typed as { username: string, age: number }
    set.status = 201;
    return { success: true };
  });
}
```

**Pros:**

- ✅ No type annotation in handler
- ✅ Full type safety
- ✅ Clean syntax

**Cons:**

- ❌ Method becomes property, not regular method
- ❌ Requires generic config type
- ❌ Different pattern than other methods

**When to use:** When you prefer functional style over methods.

### Option 3: TypedHandlerContext Alias

```typescript
import { TypedHandlerContext } from '@dockstat/elysia-decorators';

@Controller()
export class UserController {
  @Post('/create')
  @BodySchema(UserSchema)
  async createUser({ body }: TypedHandlerContext) {
    // body is 'any' - no compile-time safety
    // But runtime validation still works
    return { success: true };
  }
}
```

**Pros:**

- ✅ Convenient
- ✅ Consistent API
- ✅ Runtime validation

**Cons:**

- ❌ No compile-time type safety
- ❌ No autocomplete
- ❌ Errors caught only at runtime

**When to use:** Quick prototyping, not production.

### Option 4: Multiple Schemas

```typescript
const QuerySchema = t.Object({
  page: t.Number(),
  limit: t.Number()
});

const BodySchema = t.Object({
  name: t.String()
});

type QueryType = Static<typeof QuerySchema>;
type BodyType = Static<typeof BodySchema>;

@Controller()
export class UserController {
  @Get('/users')
  @QuerySchema(QuerySchema)
  @BodySchema(BodySchema)
  async getUsers({ query, body }: { 
    query: QueryType; 
    body: BodyType 
  }) {
    // Both query and body are fully typed
    return { page: query.page, name: body.name };
  }
}
```

## Comparison Table

| Approach | Type Safety | No Annotations | API Style | Best For |
|----------|-------------|----------------|------------|-----------|
| Manual Annotation | ⭐⭐⭐⭐⭐ | ❌ | Methods | Most projects |
| Property Wrapper | ⭐⭐⭐⭐⭐ | ✅ | Properties | Functional style |
| TypedHandlerContext | ⭐ | ✅ | Methods | Prototyping |
| Config Factories | ⭐⭐⭐⭐⭐ | ❌ | Methods | Large projects |

## The Zod Example

The user showed this working example with Zod:

```typescript
function withValidatedBody<Z extends ZodType>(schema: Z) {
  return function<T extends (body: z.infer<Z>) => any>(
    target: T
  ): (body: unknown) => ReturnType<T> {
    const replacement = function (this: any, body: unknown) {
      const parsed = schema.parse(body);
      return target.call(this, parsed);
    };

    Object.defineProperty(replacement, "name", { value: target.name });
    return replacement as (body: unknown) => ReturnType<T>;
  };
}

class Foo {
  addUser = withValidatedBody(UserSchema)(body => {
    // body is automatically typed
    return body.email;
  });
}
```

**Why this works:**

1. Returns a **new function** with modified signature
2. Uses generic types to propagate type information
3. Method is a **property**, not a regular method
4. Wraps the function at runtime to parse input

**Can we do this with decorators?**

Not currently, because:

1. Elysia's `controllers` function expects **methods**, not properties
2. The registration system calls methods directly, not wrapped functions
3. Changing this would be a **major breaking change**

## Future Possibilities

### TypeScript 5.8+?

The TypeScript team is working on enhanced decorator metadata. Future versions might allow:

```typescript
@BodySchema(UserSchema)
async handler({ body }) {  // body automatically typed
```

But this requires:

- TypeScript compiler changes
- `decoratorMetadata: true` working better
- New decorator proposal stabilization

### Declaration Merging?

Advanced TypeScript techniques might allow:

```typescript
type ControllerWithTypes<T> = T & {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer R 
    ? (...args: Args) => R 
    : never;
}
```

But this is highly experimental and unreliable.

## Current Recommendation

**Use Option 1 (Manual Type Annotation):**

```typescript
const Schema = t.Object({ name: t.String() });
type BodyType = Static<typeof Schema>;

@BodySchema(Schema)
async handler({ body }: { body: BodyType }) {
  // Full type safety ✅
}
```

**Why:**

1. Works reliably
2. Clear and explicit
3. No breaking changes
4. Full TypeScript support
5. Single source of truth (schema)

**Best Practices:**

1. Define schemas as constants
2. Extract types with `Static<typeof Schema>`
3. Reuse types across multiple methods
4. Organize schemas in separate files

Example:

```typescript
// schemas/users.ts
export const CreateUserSchema = t.Object({
  username: t.String(),
  age: t.Number()
});

export type CreateUserBody = Static<typeof CreateUserSchema>;
```

```typescript
// controllers/user.ts
import { CreateUserSchema, CreateUserBody } from '../schemas/users';

@Controller()
export class UserController {
  @Post('/create')
  @BodySchema(CreateUserSchema)
  async createUser({ body }: { body: CreateUserBody }) {
    // ✅ Type safe, clear, no duplication
  }
}
```

## Summary

**What you want:**

```typescript
@BodySchema(Schema)
async handler({ body }) {  // Automatic typing
```

**What's possible today:**

```typescript
@BodySchema(Schema)
async handler({ body }: { body: Static<typeof Schema> }) {  // Manual typing
```

**What might be possible in the future:**

- Better TypeScript decorator metadata
- New decorator proposal stabilization
- Enhanced type inference

**The bottom line:** Automatic type inference from decorators is a TypeScript limitation, not a library limitation. The current solution (manual annotation with `Static<typeof Schema>`) is the best we can do with stable TypeScript.

For more examples and patterns, see `TYPESAFE_EXAMPLES.md`.
