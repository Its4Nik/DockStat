import type { ClassMeta, RouteMeta, ElysiaConfig } from "../types";

// Store class-level metadata (prefix, etc.)
export const CLASS_STORE = new WeakMap<Function, ClassMeta>();

// Store route-level metadata (path, method, params, config)
export const ROUTE_STORE = new WeakMap<Function, Map<string | symbol, RouteMeta>>();

// Store type metadata for schema inference
export const TYPE_STORE = new WeakMap<Function, Map<string | symbol, {
    bodyType?: unknown;
    queryType?: unknown;
    paramsType?: unknown;
    headersType?: unknown;
    cookieType?: unknown;
    responseType?: unknown;
}>>();

// Helper to get or create type metadata for a route
export function getRouteTypes(target: any, propertyKey: string | symbol) {
    const constructor = target.constructor;
    if (!TYPE_STORE.has(constructor)) {
        TYPE_STORE.set(constructor, new Map());
    }
    const map = TYPE_STORE.get(constructor)!;
    if (!map.has(propertyKey)) {
        map.set(propertyKey, {});
    }
    return map.get(propertyKey)!;
}

// Helper to set type metadata for a route
export function setRouteTypes(target: any, propertyKey: string | symbol, types: {
    bodyType?: unknown;
    queryType?: unknown;
    paramsType?: unknown;
    headersType?: unknown;
    cookieType?: unknown;
    responseType?: unknown;
}) {
    const routeTypes = getRouteTypes(target, propertyKey);
    Object.assign(routeTypes, types);
}
