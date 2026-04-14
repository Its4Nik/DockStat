import type { ParamMeta } from "../types";
import { getRouteMeta } from "./getMeta";

export function createParamDecorator(type: ParamMeta['type'], key?: string) {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const meta = getRouteMeta(target, propertyKey);
        meta.params.push({ type, key, index: parameterIndex });
    };
}
