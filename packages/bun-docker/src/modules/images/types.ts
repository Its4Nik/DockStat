import type { paths } from "../../v1.54"

// ============================================================================
// Route Type Aliases from v1.54.d.ts
// ============================================================================

/**
 * List images route
 * GET /images/json
 */
export type ImageListRoute = paths["/images/json"]["get"]

/**
 * Create/pull image route
 * POST /images/create
 */
export type ImageCreateRoute = paths["/images/create"]["post"]

/**
 * Inspect image route
 * GET /images/{name}/json
 */
export type ImageInspectRoute = paths["/images/{name}/json"]["get"]

/**
 * Get image history route
 * GET /images/{name}/history
 */
export type ImageHistoryRoute = paths["/images/{name}/history"]["get"]

/**
 * Push image route
 * POST /images/{name}/push
 */
export type ImagePushRoute = paths["/images/{name}/push"]["post"]

/**
 * Tag image route
 * POST /images/{name}/tag
 */
export type ImageTagRoute = paths["/images/{name}/tag"]["post"]

/**
 * Delete image route
 * DELETE /images/{name}
 */
export type ImageDeleteRoute = paths["/images/{name}"]["delete"]

/**
 * Search images route
 * GET /images/search
 */
export type ImageSearchRoute = paths["/images/search"]["get"]

/**
 * Prune images route
 * POST /images/prune
 */
export type ImagePruneRoute = paths["/images/prune"]["post"]

/**
 * Get single image route
 * GET /images/{name}/get
 */
export type ImageGetRoute = paths["/images/{name}/get"]["get"]

/**
 * Get multiple images route
 * GET /images/get
 */
export type ImageGetAllRoute = paths["/images/get"]["get"]

/**
 * Load image route
 * POST /images/load
 */
export type ImageLoadRoute = paths["/images/load"]["post"]

/**
 * Build image route
 * POST /build
 */
export type ImageBuildRoute = paths["/build"]["post"]

/**
 * Prune build cache route
 * POST /build/prune
 */
export type BuildPruneRoute = paths["/build/prune"]["post"]

/**
 * Commit container to image route
 * POST /commit
 */
export type ImageCommitRoute = paths["/commit"]["post"]
