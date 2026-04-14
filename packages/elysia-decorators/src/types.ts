import type {
  Context,
  LocalHook,
  TSchema,
  Static
} from 'elysia';

export * from "./utils/typeHelpers"

export type ElysiaMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'all' | 'options' | 'head';

export type ElysiaConfig = Partial<LocalHook<any, any, any, any, any>>;
export type Schema = TSchema | ElysiaConfig['body'];

export interface ParamMeta {
    type: 'body' | 'query' | 'params' | 'headers' | 'cookie' | 'set' | 'context';
    key?: string;
    index: number;
}

export interface RouteMeta {
    path: string;
    method: ElysiaMethod;
    propertyKey: string | symbol;
    params: ParamMeta[];
    config: ElysiaConfig;
}

export interface ClassMeta {
    prefix?: string;
}

export type ControllerClass = new (...args: any[]) => any;

// Type inference for route handler parameters based on TypeBox schemas
// These utilities extract TypeScript types from TypeBox schema definitions
export type InferBody<Config extends ElysiaConfig> =
    Config extends { body: infer B extends TSchema } ? Static<B> : unknown;
export type InferQuery<Config extends ElysiaConfig> =
    Config extends { query: infer Q extends TSchema } ? Static<Q> : unknown;
export type InferParams<Config extends ElysiaConfig> =
    Config extends { params: infer P extends TSchema } ? Static<P> : unknown;
export type InferHeaders<Config extends ElysiaConfig> =
    Config extends { headers: infer H extends TSchema } ? Static<H> : unknown;
export type InferCookie<Config extends ElysiaConfig> =
    Config extends { cookie: infer C extends TSchema } ? Static<C> : unknown;

/**
 * Type-safe route context inferred from the route's configuration
 * Provides full type safety for:
 * - body: inferred from @BodySchema decorator
 * - query: inferred from @QuerySchema decorator
 * - params: inferred from @ParamsSchema decorator
 * - headers: inferred from @HeadersSchema decorator
 * - cookie: inferred from @CookieSchema decorator
 */
export type InferredContext<Config extends ElysiaConfig> = {
    body: InferBody<Config>;
    query: InferQuery<Config>;
    params: InferParams<Config>;
    headers: InferHeaders<Config>;
    cookie: InferCookie<Config>;
    set: Context<Config>['set'];
    request: Request;
    store: Context<Config>['store'];
};

// Type for decorated controller class
export type DecoratedController<T extends ControllerClass> = T & {
    __routeConfig__: Map<string | symbol, ElysiaConfig>;
};
