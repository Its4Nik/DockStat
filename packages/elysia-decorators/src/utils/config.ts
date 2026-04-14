import type { ElysiaConfig } from "../types";
import { getRouteMeta } from "./getMeta";
import { getRouteTypes, setRouteTypes } from "./store";

export function updateConfig<K extends keyof ElysiaConfig>(key: K, value: ElysiaConfig[K]) {
    return function (target: any, propertyKey: string | symbol) {
        const meta = getRouteMeta(target, propertyKey);
        meta.config[key] = value;

        // Also store type metadata for inference
        if (key === 'body' || key === 'query' || key === 'params' || key === 'headers' || key === 'cookie' || key === 'response') {
            const typeKey = `${String(key)}Type` as 'bodyType' | 'queryType' | 'paramsType' | 'headersType' | 'cookieType' | 'responseType';
            setRouteTypes(target, propertyKey, { [typeKey]: value });
        }
    };
}
