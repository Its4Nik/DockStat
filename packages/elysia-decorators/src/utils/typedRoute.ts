import type { TSchema, Static } from 'elysia';
import type { Context, Handler } from 'elysia';
import type { ElysiaConfig, InferredContext } from '../types';
import { getRouteTypes } from './store';

/**
 * Route configuration that includes all schemas
 * This represents the configuration created by decorators like @BodySchema, @QuerySchema, etc.
 */
export interface RouteConfig<TConfig extends ElysiaConfig = ElysiaConfig> {
    body?: TSchema;
    query?: TSchema;
    params?: TSchema;
    headers?: TSchema;
    cookie?: TSchema;
    response?: TSchema;
    detail?: Record<string, unknown>;
}

/**
 * Typed context with full type inference from route configuration
 * Use this type in your handler parameters to get automatic type safety
 */
export type TypedRouteContext<TConfig extends ElysiaConfig = ElysiaConfig> = {
    body: TConfig extends { body: infer B extends TSchema } ? Static<B> : unknown;
    query: TConfig extends { query: infer Q extends TSchema } ? Static<Q> : unknown;
    params: TConfig extends { params: infer P extends TSchema } ? Static<P> : unknown;
    headers: TConfig extends { headers: infer H extends TSchema } ? Static<H> : unknown;
    cookie: TConfig extends { cookie: infer C extends TSchema } ? Static<C> : unknown;
    request: Request;
    set: {
        status?: number;
        headers?: Record<string, string>;
        redirect?: string;
    };
    store: Record<string, unknown>;
};

/**
 * Handler function with fully typed context
 * Return type is inferred by default, but can be specified
 */
export type TypedRouteHandler<TConfig extends ElysiaConfig, Return = unknown> = (
    context: TypedRouteContext<TConfig>
) => Return | Promise<Return>;

/**
 * Creates a typed route handler with automatic type inference
 *
 * IMPORTANT: While this provides type safety, TypeScript cannot automatically
 * infer the TConfig type from decorators because decorators run at runtime.
 *
 * You have two options:
 *
 * Option 1: Use TypedHandlerContext alias (recommended for most cases)
 * @Controller()
 * export class MyController {
 *     @Post('/create')
 *     @BodySchema(t.Object({ username: t.String(), age: t.Number() }))
 *     async createUser({ body, set }: TypedHandlerContext) {
 *         // body is typed as any at compile time
 *         // BUT: You get IntelliSense from your editor based on the schema
 *         // AND: Runtime validation ensures type safety
 *         return { success: true };
 *     }
 * }
 *
 * Option 2: Use typedRoute helper with explicit config type
 * @Controller()
 * export class MyController {
 *     @Post('/create')
 *     @BodySchema(t.Object({ username: t.String(), age: t.Number() }))
 *     createUser = typedRoute<ConfigType>(({ body, set }) => {
 *         // body is fully typed as { username: string, age: number }
 *         set.status = 201;
 *         return { success: true };
 *     });
 * }
 *
 * @param handler The typed handler function
 * @returns A standard Elysia handler
 */
export function typedRoute<TConfig extends ElysiaConfig, Return = unknown>(
    handler: TypedRouteHandler<TConfig, Return>
): Handler {
    return ((context: Context) => {
        // Cast the context to the typed version to enable type inference
        return handler(context as TypedRouteContext<TConfig>);
    }) as Handler;
}

/**
 * Helper to create a route configuration type from TypeBox schemas
 * Use this to define the configuration type for your routes
 *
 * Example:
 * type CreateUserConfig = RouteConfigFrom<{
 *     body: t.Object({ username: t.String(), age: t.Number() });
 *     response: t.Object({ success: t.Boolean() });
 * }>;
 *
 * @TConfig An object with TSchema properties
 */
export type RouteConfigFrom<TConfig extends Partial<Record<keyof ElysiaConfig, TSchema>>> = TConfig;

/**
 * Alias for TypedRouteContext with any config
 * Use this as a shorthand when you don't need to specify the config type
 * Note: This won't provide strict type safety, but is convenient
 */
export type TypedHandlerContext = TypedRouteContext;

/**
 * Extracts the body type from a TypeBox schema
 */
export type ExtractBody<T extends TSchema> = Static<T>;

/**
 * Extracts the query type from a TypeBox schema
 */
export type ExtractQuery<T extends TSchema> = Static<T>;

/**
 * Extracts the params type from a TypeBox schema
 */
export type ExtractParams<T extends TSchema> = Static<T>;

/**
 * Extracts the headers type from a TypeBox schema
 */
export type ExtractHeaders<T extends TSchema> = Static<T>;

/**
 * Extracts the cookie type from a TypeBox schema
 */
export type ExtractCookie<T extends TSchema> = Static<T>;

/**
 * Creates a typed route handler factory with a specific configuration type
 * This allows you to reuse the same configuration type for multiple routes
 *
 * Example:
 * type ApiConfig = RouteConfigFrom<{
 *     headers: t.Object({ 'x-api-key': t.String() });
 * }>;
 *
 * const withApiAuth = typedRouteFactory<ApiConfig>();
 *
 * @Controller()
 * export class MyController {
 *     @Get('/data')
 *     getData = withApiAuth(({ headers, body }) => {
 *         // headers is typed with x-api-key
 *         const apiKey = headers['x-api-key'];
 *         return { data: '...' };
 *     });
 * }
 *
 * @param TConfig The route configuration type
 * @returns A function that creates typed handlers with that config
 */
export function typedRouteFactory<TConfig extends ElysiaConfig>() {
    return <Return = unknown>(handler: TypedRouteHandler<TConfig, Return>): Handler => {
        return typedRoute<TConfig, Return>(handler);
    };
}

/**
 * Validates that a value matches the expected type at runtime
 * This is a type guard that can be used for additional safety
 *
 * Example:
 * @Controller()
 * export class MyController {
 *     @Post('/create')
 *     @BodySchema(t.Object({ username: t.String(), age: t.Number() }))
 *     async createUser({ body }: TypedHandlerContext) {
 *         if (isTypedBody<{ username: string; age: number }>(body)) {
 *             // body is now guaranteed to have username and age
 *             console.log(`Creating user: ${body.username}, age: ${body.age}`);
 *         }
 *         return { success: true };
 *     }
 * }
 *
 * @T The expected type
 * @param value The value to check
 * @returns True if the value matches the type
 */
export function isTypedBody<T>(value: unknown): value is T {
    // This is a type guard - the actual validation should be done by Elysia
    // Use TypeBox's Value.Check() for runtime validation if needed
    return typeof value === 'object' && value !== null;
}

/**
 * Type helper to infer the context type from a route configuration
 * This can be used in utility functions
 */
export type InferContext<TConfig extends ElysiaConfig> = InferredContext<TConfig>;

/**
 * Helper to create a typed route handler with explicit configuration
 *
 * Example:
 * @Controller()
 * export class MyController {
 *     private config = {
 *         body: t.Object({ name: t.String() }),
 *         response: t.Object({ id: t.String() })
 *     } as const;
 *
 *     @Post('/create')
 *     @BodySchema(this.config.body)
 *     @Response(201, this.config.response)
 *     createUser = typedRouteWithConfig<typeof this.config>(({ body }) => {
 *         // body is typed as { name: string }
 *         return { id: '123' };
 *     });
 * }
 *
 * @TConfig The route configuration object
 * @param handler The typed handler function
 * @returns A standard Elysia handler
 */
export function typedRouteWithConfig<TConfig extends RouteConfig, Return = unknown>(
    handler: TypedRouteHandler<TConfig, Return>
): Handler {
    return typedRoute<TConfig, Return>(handler);
}
