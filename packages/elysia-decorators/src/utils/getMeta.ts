import type { ClassMeta, RouteMeta } from "../types";
import { CLASS_STORE, ROUTE_STORE } from "./store";

function getClassMeta(target: Function): ClassMeta {
    if (!CLASS_STORE.has(target)) {
        CLASS_STORE.set(target, {});
    }
    return CLASS_STORE.get(target)!;
}

function getRouteMeta(target: any, propertyKey: string | symbol): RouteMeta {
    const constructor = target.constructor;
    if (!ROUTE_STORE.has(constructor)) {
        ROUTE_STORE.set(constructor, new Map());
    }
    const map = ROUTE_STORE.get(constructor)!;
    if (!map.has(propertyKey)) {
        map.set(propertyKey, {
            path: '',
            method: 'get',
            propertyKey,
            params: [],
            config: {},
        });
    }
    return map.get(propertyKey)!;
}

export {getClassMeta, getRouteMeta}
