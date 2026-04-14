import type Elysia from "elysia";
import { CLASS_STORE, ROUTE_STORE, TYPE_STORE, getRouteTypes } from "./store";
import type { Context, Handler } from "elysia";
import type { ControllerClass, ElysiaConfig, InferredContext, ParamMeta } from "../types";

/**
 * Register controllers with Elysia app
 * Usage: app.use(controllers([MyController]))
 *
 * Supports two patterns:
 * 1. Context destructuring with type inference (recommended):
 *    @BodySchema(t.Object({ name: t.String() }))
 *    async handler({ body }: { body: { name: string } }) { ... }
 *
 * 2. Parameter decorators:
 *    async handler(@Body() body: any, @Query('page') page: number) { ... }
 */
export const controllers = <T extends Elysia>(Controllers: ControllerClass[]) => {
    return (app: T): T => {
        for (const Controller of Controllers) {
            const classMeta = CLASS_STORE.get(Controller) || {};
            const routes = ROUTE_STORE.get(Controller);
            const routeTypes = TYPE_STORE.get(Controller);

            if (!routes) continue;

            const instance = new Controller();

            routes.forEach((routeMeta) => {
                const basePath = classMeta.prefix || '';
                const fullPath = (basePath + routeMeta.path).replace(/\/+/g, '/') || '/';

                // Create a type-safe handler wrapper
                const elysiaHandler: Handler = (context: Context) => {
                    // Determine which pattern to use based on parameter metadata
                    const hasParamDecorators = routeMeta.params && routeMeta.params.length > 0;

                    if (hasParamDecorators) {
                        // Pattern 2: Parameter decorators - extract individual parameters
                        const params = extractParams(context, routeMeta.params);
                        return (instance as any)[routeMeta.propertyKey](...params);
                    } else {
                        // Pattern 1: Context destructuring - pass full typed context
                        const inferredConfig = routeMeta.config as ElysiaConfig;
                        type RouteContext = InferredContext<typeof inferredConfig>;
                        const typedContext = context as RouteContext;
                        return (instance as any)[routeMeta.propertyKey](typedContext);
                    }
                };

                const register = (app[routeMeta.method] as (
                    path: string,
                    handler: Handler,
                    config?: ElysiaConfig
                ) => T).bind(app);

                register(fullPath, elysiaHandler, routeMeta.config);
            });
        }
        return app;
    };
};

/**
 * Extract individual parameters from context based on parameter metadata
 * Used for the parameter decorator pattern
 */
function extractParams(context: Context, params: ParamMeta[]): unknown[] {
    return params.map(({ type, key }) => {
        switch (type) {
            case 'body':
                return context.body;
            case 'query':
                return key ? (context.query as Record<string, unknown>)[key] : context.query;
            case 'params':
                return key ? (context.params as Record<string, unknown>)[key] : context.params;
            case 'headers':
                return key ? (context.headers as Record<string, unknown>)[key] : context.headers;
            case 'cookie':
                return key ? (context.cookie as Record<string, unknown>)[key] : context.cookie;
            case 'set':
                return context.set;
            case 'context':
            default:
                return context;
        }
    });
}

/**
 * Helper function to get type-safe route config for a controller
 * This can be used for testing or advanced scenarios
 */
export function getRouteConfig<T extends ControllerClass>(
    Controller: T
): Map<string | symbol, { meta: typeof ROUTE_STORE extends WeakMap<infer K, Map<string | symbol, infer V>> ? V : never, types: typeof TYPE_STORE extends WeakMap<infer K, Map<string | symbol, infer V>> ? V : never }> {
    const routes = ROUTE_STORE.get(Controller);
    const types = TYPE_STORE.get(Controller);
    const result = new Map();

    if (routes && types) {
        routes.forEach((meta, key) => {
            result.set(key, {
                meta,
                types: types.get(key) || {}
            });
        });
    }

    return result;
}
