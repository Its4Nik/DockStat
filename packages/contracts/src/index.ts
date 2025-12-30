/**
 * @dockstatapi/contracts
 *
 * Public interface for frontend applications to consume types from the Bun Monorepo.
 * This package aggregates and re-exports types from multiple internal packages.
 *
 * @exports
 * - From `@dockstatapi/api`: `TreatyType` (Elysia app type for Eden)
 *
 * @security
 * - Only TYPE exports from @dockstatapi/api (no runtime code)
 *
 * @usage Frontend apps (dockstat) should import from this package:
 * ```ts
 * import type { App } from "@dockstat/contracts";
 * ```
 */

// Re-export API types (type-only - App for Elysia app type for Eden)
export type { TreatyType } from "@dockstat/api";
