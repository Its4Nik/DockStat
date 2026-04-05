import type { paths } from "../../v1.54"

// ============================================================================
// Route Type Aliases from v1.54.d.ts
// ============================================================================

/**
 * Route type for GET /networks - List networks
 */
export type NetworkListRoute = paths["/networks"]["get"]

/**
 * Route type for GET /networks/{id} - Inspect a network
 */
export type NetworkInspectRoute = paths["/networks/{id}"]["get"]

/**
 * Route type for DELETE /networks/{id} - Remove a network
 */
export type NetworkDeleteRoute = paths["/networks/{id}"]["delete"]

/**
 * Route type for POST /networks/create - Create a network
 */
export type NetworkCreateRoute = paths["/networks/create"]["post"]

/**
 * Route type for POST /networks/{id}/connect - Connect a container to a network
 */
export type NetworkConnectRoute = paths["/networks/{id}/connect"]["post"]

/**
 * Route type for POST /networks/{id}/disconnect - Disconnect a container from a network
 */
export type NetworkDisconnectRoute = paths["/networks/{id}/disconnect"]["post"]

/**
 * Route type for POST /networks/prune - Delete unused networks
 */
export type NetworkPruneRoute = paths["/networks/prune"]["post"]
