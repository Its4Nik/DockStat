import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MiddlewareFunction,
} from "react-router"
import { createContext, data } from "react-router"
import { z } from "zod"
import type { RouteArgs } from "../lib/http"
import { BaseLogger } from "../logger"

const logger = BaseLogger.spawn("Validation")

/** Form field that selects which operation a submission targets. */
export const OPERATION_FIELD = "__operation__"

/** JSON field carrying the JSON-serialized payload for programmatic submissions. */
export const PAYLOAD_FIELD = "__payload"

/** Zod issues flattened into a form-friendly shape (`z.flattenError`). */
export interface ValidationErrors {
  fieldErrors: Record<string, string[] | undefined>
  formErrors: string[]
}

/** Returned as action data (HTTP 400) when a submission fails validation. */
export interface ValidationFailure {
  errors: ValidationErrors
  message: string
  success: false
}

/** `data()`-wrapped validation failure carrying the 400 status. */
export type ValidationFailureResponse = ReturnType<typeof data<ValidationFailure>>

/**
 * A route action receiving the standard route args plus schema-validated data.
 *
 * The arg type is `RouteArgs<any>` — RR's `Params<string>` doesn't name
 * specific keys, so a strict contravariant check would reject handlers that
 * annotate typed params (`RouteArgs<{ id: string }>`). `any` params keep such
 * handlers assignable while they still enjoy their own precise annotation.
 */
export type ValidatedAction<Schema extends z.ZodType, R = unknown> = (
  args: RouteArgs<any>,
  data: z.output<Schema>
) => R

/**
 * One registry entry: the schema to validate against and the action to run.
 * The action's `data` parameter is typed as the schema's output and checked
 * against it, so schema/action mismatches fail to compile in {@link validate}.
 */
export interface ValidatedOperation<Schema extends z.ZodType = z.ZodType, R = unknown> {
  schema: Schema
  action(args: ActionFunctionArgs, data: z.output<Schema>): R
}

/**
 * Structural (variance-safe) shape of any operation.
 *
 * `action`'s `data` is `never` so that *method-position* bivariance lets every
 * concrete `ValidatedOperation<SomeSchema, SomeReturn>` satisfy it without
 * erasing the concrete schema/return types (assignable in the same direction
 * the old `Record<string, ValidatedOperation<z.ZodType, unknown>>` wanted, but
 * actually sound — heterogeneous op maps check fine).
 */
export interface AnyValidatedOperation {
  schema: unknown
  action(args: ActionFunctionArgs, data: never): unknown
}

/**
 * Pairs a schema with an action for use in a {@link withValidation} registry.
 */
export function validate<Schema extends z.ZodType, R>(
  schema: Schema,
  action: ValidatedAction<Schema, R>
): ValidatedOperation<Schema, R> {
  return { action, schema }
}

/** Shared metadata for a generated route group. */
export interface SchemaGroupOptions {
  /** Route path relative to the `/api/v3/` mount, e.g. `"auth/api-keys/:id"`. */
  path?: string
  /** Mount outside the require-auth layout (login, OIDC flows, ...). */
  isPublic?: boolean
  /** Roles allowed to call this group's mutations (e.g. ["admin"]). */
  roles?: string[]
  /**
   * Exclude this group from route generation — the group can still be
   * re-exported manually (e.g. the login page mounts `User.Basic` itself).
   * Requires no `path`.
   */
  ignored?: boolean
}

/**
 * Structural shape of a schema group as seen by the route generator and the
 * schema registry. Concrete groups (from `withValidation`) are assignable to
 * this regardless of their operation keys, schemas, or return types.
 */
export interface SchemaGroupLike {
  _ops: Record<string, AnyValidatedOperation>
  _options: SchemaGroupOptions
  middleware: MiddlewareFunction<Response>
  action: (args: ActionFunctionArgs) => unknown
  loader?: GroupLoader
}

/** The registry consumed by the route generator: Category → Group → group. */
export type SchemaRegistry = Record<string, Record<string, SchemaGroupLike>>

/**
 * Marker for status/headers-carrying API results produced by `ok()`/`fail()`
 * (see `.server/lib/http`). `buildGroup` unwraps these into React Router
 * `data()` responses, so actions can return status/header-carrying values
 * while the client still sees plain, fully-typed JSON payloads.
 */
export interface ApiResult<T = unknown> {
  payload: T
  init?: ResponseInit
}

type Awaited<T> = T extends PromiseLike<infer V> ? Awaited<V> : T

/** Unwraps a settled action value into the client-facing JSON data type. */
type UnwrapData<T> =
  T extends { payload: infer P; init?: ResponseInit | null | undefined }
    ? P
    : T extends { data: infer D; init: ResponseInit | null | undefined }
      ? D
      : T extends Response
        ? never
        : T

/**
 * Client-facing data type of an operation return: `ApiResult`/`data()` shells
 * are unwrapped to their payload; raw `Response`s have no inferable data;
 * plain objects pass through as-is (awaited).
 */
export type OperationData<R> = R extends PromiseLike<infer V>
  ? OperationData<V>
  : UnwrapData<R>

/** Union of the client-facing data types of all registered operations. */
export type OperationReturn<Ops extends Record<string, AnyValidatedOperation>> = {
  [K in keyof Ops]: OperationData<Awaited<ReturnType<Ops[K]["action"]>>>
}[keyof Ops]

/**
 * Loader handlers may use typed `RouteArgs` params — see the note on
 * {@link ValidatedAction} for why the arg type is `RouteArgs<any>`.
 */
export type GroupLoader = (args: RouteArgs<any>) => unknown

/** A group with a `loader` — the generated route exports it too. */
export interface SchemaGroupWithLoader<Ops extends Record<string, AnyValidatedOperation>> {
  _ops: Ops
  _options: SchemaGroupOptions
  middleware: MiddlewareFunction<Response>
  action: (args: ActionFunctionArgs) => Promise<OperationReturn<Ops> | ValidationFailureResponse>
  loader: GroupLoader
}

/** A mutation-only group — no loader on the generated route. */
export interface SchemaGroupMutationsOnly<Ops extends Record<string, AnyValidatedOperation>> {
  _ops: Ops
  _options: SchemaGroupOptions
  middleware: MiddlewareFunction<Response>
  action: (args: ActionFunctionArgs) => Promise<OperationReturn<Ops> | ValidationFailureResponse>
}

export type SchemaGroup<Ops extends Record<string, AnyValidatedOperation>> =
  | SchemaGroupWithLoader<Ops>
  | SchemaGroupMutationsOnly<Ops>

/**
 * Flattens FormData into a plain object without coercing values.
 */
function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    const existing = result[key]
    if (existing === undefined) {
      result[key] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      result[key] = [existing, value]
    }
  }
  return result
}

/**
 * Reads a mutation request body as a plain object. JSON submissions may nest
 * the payload under {@link PAYLOAD_FIELD} (the generated client's wire format).
 */
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const parsed: unknown = await request.json()
    if ((parsed as Record<string, unknown>)[PAYLOAD_FIELD] !== undefined) {
      const rawPayload = (parsed as Record<string, unknown>)[PAYLOAD_FIELD]
      let payload: unknown = rawPayload

      if (typeof rawPayload === "string") {
        try {
          payload = JSON.parse(rawPayload)
        } catch {
          return {}
        }
      }

      return typeof payload === "object" && payload !== null && !Array.isArray(payload)
        ? {
            ...(parsed as Record<string, unknown>),
            ...(payload as Record<string, unknown>),
          }
        : {}
    }

    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  }

  if (contentType.includes("form")) {
    return formDataToObject(await request.formData())
  }

  return {}
}

function buildGroup<Ops extends Record<string, AnyValidatedOperation>>(
  operations: Ops,
  options: SchemaGroupOptions,
  loader?: GroupLoader
) {
  type OperationKey = Extract<keyof Ops, string>
  type ValidPayload = {
    [K in OperationKey]: {
      operation: K
      data: z.output<Ops[K]["schema"] extends z.ZodType ? Ops[K]["schema"] : z.ZodType>
    }
  }[OperationKey]
  type Payload = ValidPayload | { failed: ValidationErrors }

  const validatedPayload = createContext<Payload | undefined>(undefined)

  // ── Single-operation groups infer the operation from the request body ──
  const singleOperation =
    Object.keys(operations).length === 1
      ? (Object.keys(operations) as OperationKey[])[0]
      : undefined

  const middleware: MiddlewareFunction<Response> = async ({ request, context }, next) => {
    if (request.method === "GET" || request.method === "HEAD") return await next()

    const path = new URL(request.url).pathname
    const failValidation = (errors: ValidationErrors): Promise<Response> => {
      context.set(validatedPayload, { failed: errors })
      return next()
    }

    let raw: Record<string, unknown>
    try {
      raw = await readBody(request)
    } catch {
      logger.warn(`[${request.method}] ${path}: malformed request body`)
      return await failValidation({ fieldErrors: {}, formErrors: ["Malformed request body"] })
    }

    const { [OPERATION_FIELD]: operation, ...fields } = raw

    const resolvedOperation =
      typeof operation === "string" && Object.hasOwn(operations, operation)
        ? operation
        : singleOperation

    if (!resolvedOperation || !Object.hasOwn(operations, resolvedOperation)) {
      logger.warn(
        `[${request.method}] ${path}: unknown ${OPERATION_FIELD} ${JSON.stringify(operation)}`
      )
      return await failValidation({
        fieldErrors: {},
        formErrors: [`Unknown ${OPERATION_FIELD}: ${String(operation)}`],
      })
    }

    const op = operations[resolvedOperation] as AnyValidatedOperation & {
      schema: z.ZodType
    }
    const result = await op.schema.safeParseAsync(fields)

    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error)
      logger.warn(
        `[${request.method}] ${path}: validation failed for operation "${resolvedOperation}": ${JSON.stringify({ fieldErrors, formErrors })}`
      )
      return await failValidation({ fieldErrors, formErrors })
    }

    context.set(
      validatedPayload,
      { data: result.data, operation: resolvedOperation } as ValidPayload
    )
    return next()
  }

  const action = async (
    args: ActionFunctionArgs
  ): Promise<OperationReturn<Ops> | ValidationFailureResponse> => {
    const payload = args.context.get(validatedPayload)

    if (!payload) {
      throw new Error(
        "withValidation: no validated payload in context — did you forget `export const middleware = [validation.middleware]`?"
      )
    }

    if ("failed" in payload) {
      const validationErrorsToMessage = (errors: ValidationErrors): string => {
        const fieldMessages = Object.entries(errors.fieldErrors).flatMap(([field, messages]) =>
          (messages ?? []).map((message) => `${field}: ${message}`)
        )
        return [...errors.formErrors, ...fieldMessages].join("\n")
      }

      return data(
        {
          errors: payload.failed,
          message: validationErrorsToMessage(payload.failed),
          success: false,
        },
        { status: 400 }
      )
    }

    const { action: opAction } = operations[payload.operation]
    const result = await (opAction as AnyValidatedOperation["action"])(args, payload.data as never)

    // Unwrap `ok()`/`fail()` envelopes into RR `data()` responses so status
    // and headers survive the trip while the client sees the plain payload.
    if (
      result !== null &&
      typeof result === "object" &&
      "payload" in result &&
      "init" in result
    ) {
      const envelope = result as { payload: unknown; init?: ResponseInit }
      return data(envelope.payload, envelope.init) as OperationReturn<Ops>
    }

    return result as OperationReturn<Ops>
  }

  return loader !== undefined
    ? ({ _ops: operations, _options: options, action, loader, middleware } as const)
    : ({ _ops: operations, _options: options, action, middleware } as const)
}

/**
 * Wraps a registry of validated operations as a schema group: a middleware +
 * action pair the generated route modules re-export, plus the group metadata
 * (`path`, `isPublic`, `roles`) the route generator reads.
 *
 * Groups with a single operation accept submissions without an explicit
 * `__operation__` field — the operation is inferred.
 */
export function withValidation<Ops extends Record<string, AnyValidatedOperation>>(
  operations: Ops
): SchemaGroupMutationsOnly<Ops>
export function withValidation<Ops extends Record<string, AnyValidatedOperation>>(
  operations: Ops,
  options: SchemaGroupOptions & { loader: GroupLoader }
): SchemaGroupWithLoader<Ops>
export function withValidation<Ops extends Record<string, AnyValidatedOperation>>(
  operations: Ops,
  options: SchemaGroupOptions
): SchemaGroupMutationsOnly<Ops>
export function withValidation<Ops extends Record<string, AnyValidatedOperation>>(
  operations: Ops,
  options?: SchemaGroupOptions & { loader?: GroupLoader }
): SchemaGroup<Ops> {
  const { loader, ...groupOptions } = options ?? { path: "" }
  return buildGroup(operations, groupOptions, loader) as SchemaGroup<Ops>
}
