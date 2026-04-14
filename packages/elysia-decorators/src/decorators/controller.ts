import type { ControllerClass } from "../types";

/**
 * Class decorator to mark a class as a Controller
 * Usage:
 * @Controller()
 * export class MyController {
 *    @Post('/') @BodySchema(...)
 *    async route({ body }) { ... }
 * }
 *
 * With optional prefix (alternative to @Group):
 * @Controller('/api')
 * export class MyController {
 *    ...
 * }
 *
 * With config object:
 * @Controller({ prefix: '/api' })
 * export class MyController {
 *    ...
 * }
 */
export function Controller(prefixOrConfig?: string | { prefix?: string }): ClassDecorator {
    return function (target: Function) {
        // Import here to avoid circular dependency
        const { getClassMeta } = require("../utils/getMeta");
        const meta = getClassMeta(target);

        if (typeof prefixOrConfig === 'string') {
            meta.prefix = prefixOrConfig;
        } else if (typeof prefixOrConfig === 'object' && prefixOrConfig?.prefix) {
            meta.prefix = prefixOrConfig.prefix;
        }
    };
}

/**
 * @deprecated Use the @Controller() decorator instead of wrapping classes
 * This function is kept for backward compatibility but will be removed in a future version.
 *
 * Old usage (DO NOT USE - causes decorator errors):
 * export const MyController = Controller(class MyController { ... })
 *
 * New usage:
 * @Controller()
 * export class MyController { ... }
 */
export function ControllerWrapper<T extends ControllerClass>(controller: T): T {
    return controller;
}
