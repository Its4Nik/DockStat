import type { ElysiaConfig } from "../types";
import { getRouteMeta } from "../utils/getMeta";

export function Config(config: Partial<ElysiaConfig>) {
    return function (target: any, propertyKey: string | symbol) {
        Object.assign(getRouteMeta(target, propertyKey).config, config);
    };
}
