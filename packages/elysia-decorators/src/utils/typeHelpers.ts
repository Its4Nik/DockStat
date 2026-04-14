import type { Static, TSchema } from 'elysia';
import type { ElysiaConfig } from '../types';

/**
 * Extract the static TypeScript type from a TypeBox schema
 * This is a type-level utility that converts runtime schemas to TypeScript types
 */
export type InferType<T extends TSchema | undefined> = T extends TSchema ? Static<T> : never;

/**
 * Infer the body type from an ElysiaConfig
 * If no body schema is defined, returns unknown
 */
export type InferBodyType<Config extends ElysiaConfig> =
    Config extends { body: infer B extends TSchema } ? Static<B> : unknown;

/**
 * Infer the query type from an ElysiaConfig
 * If no query schema is defined, returns unknown
 */
export type InferQueryType<Config extends ElysiaConfig> =
    Config extends { query: infer Q extends TSchema } ? Static<Q> : unknown;

/**
 * Infer the params type from an ElysiaConfig
 * If no params schema is defined, returns unknown
 */
export type InferParamsType<Config extends ElysiaConfig> =
    Config extends { params: infer P extends TSchema } ? Static<P> : unknown;

/**
 * Infer the headers type from an ElysiaConfig
 * If no headers schema is defined, returns unknown
 */
export type InferHeadersType<Config extends ElysiaConfig> =
    Config extends { headers: infer H extends TSchema } ? Static<H> : unknown;

/**
 * Infer the cookie type from an ElysiaConfig
 * If no cookie schema is defined, returns unknown
 */
export type InferCookieType<Config extends ElysiaConfig> =
    Config extends { cookie: infer C extends TSchema } ? Static<C> : unknown;

/**
 * Infer the response type from an ElysiaConfig
 * If no response schema is defined, returns unknown
 */
export type InferResponseType<Config extends ElysiaConfig> =
    Config extends { response: infer R }
        ? R extends Record<number, infer Schema extends TSchema>
            ? Static<Schema>
            : unknown
        : unknown;

/**
 * Fully typed route context based on ElysiaConfig
 * Provides type-safe access to all route parameters
 */
export type TypedRouteContext<Config extends ElysiaConfig> = {
    body: InferBodyType<Config>;
    query: InferQueryType<Config>;
    params: InferParamsType<Config>;
    headers: InferHeadersType<Config>;
    cookie: InferCookieType<Config>;
    request: Request;
    set: {
        status?: number;
        headers?: Record<string, string>;
        redirect?: string;
    };
    store: Record<string, unknown>;
};

/**
 * Helper type for route handler parameters
 * Extracts the context type from the route's configuration
 */
export type RouteHandler<Config extends ElysiaConfig, Return = unknown> = (
    context: TypedRouteContext<Config>
) => Return | Promise<Return>;

/**
 * Merge multiple configs into a single typed config
 * Useful when combining class-level and method-level configurations
 */
export type MergeConfigs<T extends ElysiaConfig, U extends ElysiaConfig> = Omit<T, keyof U> & U;

/**
 * Runtime type guard to check if a value is a TypeBox schema
 */
export function isTypeBoxSchema(value: unknown): value is TSchema {
    return typeof value === 'object' && value !== null && 'type' in value;
}

/**
 * Extract the static type from a schema at runtime (for debugging/testing)
 * Note: This returns the runtime structure, not a TypeScript type
 */
export function extractSchemaType(schema: TSchema): unknown {
    return schema;
}

/**
 * Type-safe schema wrapper that preserves the TypeBox schema
 */
export class TypedSchema<T extends TSchema> {
    constructor(public readonly schema: T) {}

    /**
     * Get the TypeScript type associated with this schema
     * This is a type-level utility and doesn't exist at runtime
     */
    public readonly type!: Static<T>;
}

/**
 * Create a typed schema wrapper
 * Usage: const bodySchema = typed(t.Object({ name: t.String() }))
 */
export function typed<T extends TSchema>(schema: T): TypedSchema<T> {
    return new TypedSchema(schema);
}
