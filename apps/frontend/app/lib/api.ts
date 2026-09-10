/**
 * Typed API client for the schema-generated `/api/v3/` routes.
 *
 * The route generator (`.server/scripts/index.ts`) pairs every schema group
 * operation with its route path via `clientAction`, producing entries in
 * `lib/executeAction` whose arguments (path params, body) and return values
 * are fully inferred from the server-side `Schemas` object — no casts.
 *
 *   import { executeAction } from "~/lib/executeAction"
 *   const res = await executeAction["Auth.ApiKey.revoke"]({
 *     params: { id: "abc" },           // required when the path has :params
 *   })
 *   //    ^? { message: string; success: boolean } | ValidationFailure | FailedResult
 */
import type { OperationData, ValidationFailure } from "~/.server/middleware/withValidation"
import type { z } from "zod"

export type { ValidationFailure }

/** Rebuilt on the client from the ops map — structurally identical to the server's type. */
interface ClientValidatedOperation {
  schema: z.ZodType
  action(args: unknown, data: never): unknown
}

/** `{ __operation__, ...fields }` — the wire format expected by the middleware. */
type Submission = { __operation__: string } & Record<string, unknown>

/** Failed-response marker for non-JSON error responses (no data to infer). */
export interface FailedResult {
  __failed: true
  status: number
}

/**
 * Parses a route path literal (`"auth/api-keys/:id"`) into a params type
 * (`{ id: string }`). Static segments contribute nothing.
 */
export type PathParams<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof PathParams<Rest>]: string }
    : Path extends `${infer _Start}:${infer Param}`
      ? { [K in Param]: string }
      : {}

export interface CallOptions<Body, P> {
  /** Path params — required exactly when the route path declares them. */
  params?: P
  /** JSON-validated body; must match the operation's zod schema. */
  body?: Body
  /** Override the group's route path (defaults to the registered path). */
  path?: string
}

const BASE = "/api/v3"

/**
 * Performs the actual POST against a generated route. `__operation__` is
 * always sent so multi-operation groups stay unambiguous.
 */
async function post(
  path: string,
  operation: string,
  body: Record<string, unknown> | undefined
): Promise<unknown> {
  const payload: Submission = body
    ? { __operation__: operation, ...body }
    : { __operation__: operation }

  const res = await fetch(`${BASE}/${path.replace(/^\/+/, "")}`, {
    body: JSON.stringify(payload),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST",
  })

  // Validation failures (400) carry a parseable body; transport errors don't.
  try {
    return (await res.json()) as unknown
  } catch {
    return { __failed: true as const, status: res.status }
  }
}

/**
 * Builds a fully-typed caller for one operation of a schema group.
 * Used only by the generated `lib/executeAction` registry.
 *
 * The generated registry passes the ops map as a **type argument** —
 * `clientAction<typeof Schemas.Auth.ApiKey._ops>("revoke", "auth/api-keys/:id")`
 * — with a type-only `Schemas` import, so no server module is ever pulled
 * into the client bundle.
 *
 * - `K` (operation) and `Path` are inferred from the runtime strings.
 * - Return type: the operation's declared data union, plus the shapes the
 *   middleware can always produce (`ValidationFailure`, HTTP 400) and the
 *   client's transport-failure marker (`FailedResult`).
 */
export function clientAction<
  Ops extends Record<string, ClientValidatedOperation>,
  K extends keyof Ops & string,
  Path extends string,
>(
  operation: K,
  path: Path
): (
  options: CallOptions<z.input<Ops[K]["schema"]>, PathParams<Path>> &
    (PathParams<Path> extends Record<string, never> ? object : { params: PathParams<Path> })
) => Promise<
  | OperationData<Awaited<ReturnType<Ops[K]["action"]>>>
  | ValidationFailure
  | FailedResult
> {
  return async (options) => {
    const params = (options.params ?? {}) as Record<string, string>
    let finalPath: string = path
    for (const [key, value] of Object.entries(params)) {
      finalPath = finalPath.replaceAll(`:${key}`, String(value))
    }

    return post(finalPath, operation, options.body as Record<string, unknown> | undefined) as Promise<
      | OperationData<Awaited<ReturnType<Ops[K]["action"]>>>
      | ValidationFailure
      | FailedResult
    >
  }
}
