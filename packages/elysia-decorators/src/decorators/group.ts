import { getClassMeta } from "../utils/getMeta";

export function Group(prefix: string) {
    return function (target: Function) {
        const meta = getClassMeta(target);
        meta.prefix = prefix;
    };
}
