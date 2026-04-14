import type { ElysiaMethod } from "../types";
import { getRouteMeta } from "./getMeta";

export function createMethodDecorator(method: ElysiaMethod) {
    return function (path: string) {
        return function (target: any, propertyKey: string | symbol) {
            const meta = getRouteMeta(target, propertyKey);
            meta.method = method;
            meta.path = path;
        };
    };
}
