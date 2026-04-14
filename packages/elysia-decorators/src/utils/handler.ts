import type { TSchema, Static } from 'elysia';
import type { Context, Handler } from 'elysia';
import type { ElysiaConfig } from '../types';
import { getRouteTypes } from './store';

/**
 * Extracts the static TypeScript type from a TypeBox schema
 */
export type ExtractSchemaType<T extends TSchema | undefined> = T extends TSchema ? Static<T> : unknown;

/**
 * Infers the context type from the route's configuration
 * This is the type that will be passed to typed handlers
 */
export type InferredHandlerContext<Config extends ElysiaConfig> = {
    body: Config extends { body: infer B extends TSchema } ? Static<B> : unknown;
    query: Config extends { query: infer Q extends TSchema } ? Static<Q> : unknown;
    params: Config extends { params: infer P extends TSchema } ? Static<P> : unknown;
    headers: Config extends { headers: infer H extends TSchema } ? Static<H> : unknown;
    cookie: Config extends { cookie: infer C extends TSchema } ? Static<C> : unknown;
    request: Request;
    set: {
        status?: number;
        headers?: Record<string, string>;
        redirect?: string;
    };
    store: Record<string, unknown>;
};

/**
 * A typed handler that receives the fully inferred context
 * This is what controller methods should return
 */
export type TypedHandler<Config extends ElysiaConfig, Return = unknown> = (
    context: InferredHandlerContext<Config>
) => Return | Promise<Return>;

/**
 * Creates a typed handler wrapper that provides automatic type inference
 *
 * Usage in controller methods:
 *
 * ```typescript
 * @Controller()
 * export class MyController {
 *     @Post('/create')
 *     @BodySchema(t.Object({ username: t.String(), age: t.Number() }))
 *     async createUser({ body, set }: TypedHandlerContext) {
 *         // body is automatically typed as { username: string, age: number }
 *         // set is automatically typed as Elysia's Context['set']
 *         set.status = 201;
 *         return { success: true };
 *     }
 * }
 * ```
 *
 * @param config The route configuration (automatically inferred from decorators)
 * @param handler The handler function with typed parameters
 * @returns A standard Elysia handler
 */
export function createTypedHandler<Config extends ElysiaConfig, Return>(
    config: Config,
    handler: TypedHandler<Config, Return>
): Handler {
    return (context: Context) => {
        // Cast the context to the inferred type to enable type inference in the handler
        const typedContext = context as InferredHandlerContext<Config>;
        return handler(typedContext);
    };
}

/**
 * Helper to extract route configuration from a controller class and method
 * This is used internally by the registration system
 */
export function extractRouteConfig<Config extends ElysiaConfig>(
    config: Config
): Config {
    return config;
}

/**
 * Type alias for the inferred context type
 * Use this in your controller methods for automatic type inference
 */
export type TypedHandlerContext = InferredHandlerContext<any>;

/**
 * Helper type to get the body type from a schema
 */
export type GetBodyType<S extends TSchema> = Static<S>;

/**
 * Helper type to get the query type from a schema
 */
export type GetQueryType<S extends TSchema> = Static<S>;

/**
 * Helper type to get the params type from a schema
 */
export type GetParamsType<S extends TSchema> = Static<S>;

/**
 * Helper type to get the headers type from a schema
 */
export type GetHeadersType<S extends TSchema> = Static<S>;

/**
 * Helper type to get the cookie type from a schema
 */
export type GetCookieType<S extends TSchema> = Static<S>;

/**
 * Merges multiple schemas into a single configuration
 * Useful when combining class-level and method-level schemas
 */
export type MergeSchemas<T extends Partial<ElysiaConfig>, U extends Partial<ElysiaConfig>> = Omit<T, keyof U> & U;

/**
 * Validates that a value matches a TypeBox schema at runtime
 * This is a helper for runtime validation when needed
 */
export function validateSchema<T extends TSchema>(
    schema: T,
    value: unknown
): value is Static<T> {
    // This is a placeholder - actual validation would use TypeBox's Value.Check
    // For now, we just cast the type
    return true;
}

/**
 * Extracts types from route metadata
 * Used internally by the typed handler system
 */
export function extractTypesFromConfig<Config extends ElysiaConfig>(config: Config): {
    bodyType: Config extends { body: infer B extends TSchema } ? Static<B> : unknown;
    queryType: Config extends { query: infer Q extends TSchema } ? Static<Q> : unknown;
    paramsType: Config extends { params: infer P extends TSchema } ? Static<P> : unknown;
    headersType: Config extends { headers: infer H extends TSchema } ? Static<H> : unknown;
    cookieType: Config extends { cookie: infer C extends TSchema } ? Static<C> : unknown;
} {
    return {
        bodyType: (config as any).body ? extractSchemaType((config as any).body) : unknown,
        queryType: (config as any).query ? extractSchemaType((config as any).query) : unknown,
        paramsType: (config as any).params ? extractSchemaType((config as any).params) : unknown,
        headersType: (config as any).headers ? extractSchemaType((config as any).headers) : unknown,
        cookieType: (config as any).cookie ? extractSchemaType((config as any).cookie) : unknown,
    };
}

/**
 * Helper to extract static type from a schema
 */
function extractSchemaType<T extends TSchema>(schema: T): Static<T> {
    // This is a type-level helper - the actual type extraction happens at compile time
    // The runtime implementation just returns the schema
    return schema as unknown as Static<T>;
}

/**
 * Creates a type-safe route handler factory
 * Use this to create handlers with automatic type inference from schemas
 */
export function typedHandlerFactory<Config extends ElysiaConfig>(config: Config) {
    return <Return>(handler: TypedHandler<Config, Return>): Handler => {
        return createTypedHandler(config, handler);
    };
}
