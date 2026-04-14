import type { ElysiaConfig } from "../types";
import { getRouteMeta } from "../utils/getMeta";

export function Response(status: number, schema: ElysiaConfig['response']) {
    return function (target: any, propertyKey: string | symbol) {
        const meta = getRouteMeta(target, propertyKey);
        if (!meta.config.response) {
            meta.config.response = {} as ElysiaConfig['response'];
        }
        (meta.config.response as Record<number, unknown>)[status] = schema;
    };
}
