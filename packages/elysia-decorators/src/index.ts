import { controllers } from "./utils/register"

export * from "./decorators"
export type * as TYPES from "./types"
export type { TypedHandlerContext } from "./utils/handler"
export * from "./utils/typedRoute"

// Export controllers for convenience
export const Controllers = controllers
export { controllers }

export default controllers
