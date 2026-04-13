import type { paths } from "../../v1.54"

// ============================================================================
// Route Type Aliases from v1.54.d.ts
// ============================================================================

/**
 * List configs route
 * GET /configs
 */
export type ConfigListRoute = paths["/configs"]["get"]

/**
 * Create config route
 * POST /configs/create
 */
export type ConfigCreateRoute = paths["/configs/create"]["post"]

/**
 * Inspect config route
 * GET /configs/{id}
 */
export type ConfigInspectRoute = paths["/configs/{id}"]["get"]

/**
 * Delete config route
 * DELETE /configs/{id}
 */
export type ConfigDeleteRoute = paths["/configs/{id}"]["delete"]

/**
 * Update config route
 * POST /configs/{id}/update
 */
export type ConfigUpdateRoute = paths["/configs/{id}/update"]["post"]
