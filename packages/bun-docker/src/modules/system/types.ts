import type { paths } from "../../v1.54"

// ============================================================================
// Route Type Aliases from v1.54.d.ts
// ============================================================================

/**
 * Check auth configuration route
 * POST /auth
 */
export type AuthRoute = paths["/auth"]["post"]

/**
 * Get system information route
 * GET /info
 */
export type InfoRoute = paths["/info"]["get"]

/**
 * Get version route
 * GET /version
 */
export type VersionRoute = paths["/version"]["get"]

/**
 * Ping system route
 * GET /_ping
 */
export type PingRoute = paths["/_ping"]["get"]

/**
 * Ping system route (HEAD method)
 * HEAD /_ping
 */
export type PingHeadRoute = paths["/_ping"]["head"]

/**
 * Monitor events route
 * GET /events
 */
export type EventsRoute = paths["/events"]["get"]

/**
 * Get data usage information route
 * GET /system/df
 */
export type DataUsageRoute = paths["/system/df"]["get"]
