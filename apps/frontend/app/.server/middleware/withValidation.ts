import type { ActionFunctionArgs, MiddlewareFunction } from "react-router"
import { createContext, data } from "react-router"
import { z } from "zod"
import { BaseLogger } from "../logger"

const logger = BaseLogger.spawn("Validation")

/** Form field that selects which operation a submission targets. */
export const OPERATION_FIELD = "__operation__"

/** Zod issues flattened into a form-friendly shape (`z.flattenError`). */
export interface ValidationErrors {
  fieldErrors: Record<string, string[] | undefined>
  formErrors: string[]
}

/** Returned as action data (HTTP 400) when a submission fails validation. */
export interface ValidationFailure {
  errors: ValidationErrors
  success: false
  message: string
}

/** `data()`-wrapped validation failure carrying the 400 status. */
export type ValidationFailureResponse = ReturnType<typeof data<ValidationFailure>>

/** A route action receiving the standard route args plus schema-validated data. */
export type ValidatedAction<Schema extends z.ZodType, R = unknown> = (
  args: ActionFunctionArgs,
  data: z.output<Schema>
) => R

/** One registry entry: the schema to validate against and the action to run. */
export interface ValidatedOperation<Schema extends z.ZodType = z.ZodType, R = unknown> {
  schema: Schema
  action(args: ActionFunctionArgs, data: z.output<Schema>): R
}

/**
 * Pairs a schema with an action for use in a {@link withValidation} registry.
 * The action's `data` parameter is typed as the schema's output and checked
 * against it, so schema/action mismatches fail to compile here.
 *
 *   validate(z.object({ name: z.string() }), (args, data) => {
 *     data.name // string
 *   })
 */
export function validate<Schema extends z.ZodType, R>(
  schema: Schema,
  action: ValidatedAction<Schema, R>
): ValidatedOperation<Schema, R> {
  return { action, schema }
}

/**
 * Flattens FormData into a plain object without coercing values: strings stay
 * strings, `File` instances stay `File` instances (so `z.instanceof(File)` /
 * `z.file()` just work), and repeated keys collapse into arrays. Any shape of
 * form is accepted — the operation's schema decides which fields are expected.
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
 * Reads a mutation request body as a plain object. JSON bodies (API clients)
 * and form bodies (`<Form>` submissions, file uploads) are both supported and
 * passed through verbatim apart from the `__operation__` selector field.
 */
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const parsed: unknown = await request.json()
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  }

  // Matches both multipart/form-data and application/x-www-form-urlencoded.
  if (contentType.includes("form")) {
    return formDataToObject(await request.formData())
  }

  return {}
}

/**
 * Builds the `middleware` / `action` pair for a route that multiplexes several
 * operations over one endpoint. Submissions carry an `__operation__` field
 * (JSON property or form field); the middleware looks the operation up,
 * validates the remaining fields against its schema and stashes the result in
 * router context, and the action dispatches to the registered action with
 * fully-typed validated data.
 *
 * The middleware only inspects mutation requests — GET/HEAD pass straight
 * through — and schemas see exactly what was submitted: strings, `File`
 * instances and arrays for repeated keys, so varying form shapes (uploads
 * included) are validated as-is.
 *
 * Failures never short-circuit with a raw `Response` from the middleware: a
 * returned Response bypasses the single-fetch envelope, which makes the client
 * raise it to the nearest ErrorBoundary. Instead the middleware records the
 * failure in router context (with server-side logging) and the action returns
 * it via `data(..., { status: 400 })`, so it arrives as renderable
 * `actionData` and skips loader revalidation, while registered actions only
 * ever run with valid data.
 *
 * Usage:
 *
 *   const validation = withValidation({
 *     localLogin: validate(
 *       z.object({ name: z.string(), pass: z.string() }),
 *       Actions.Auth.localLogin
 *     ),
 *   })
 *   export const middleware: Route.MiddlewareFunction[] = [validation.middleware]
 *   export const action = validation.action
 */
export function withValidation<Ops extends Record<string, ValidatedOperation>>(
  operations: Ops
): {
  middleware: MiddlewareFunction<Response>
  action: (args: ActionFunctionArgs) => Promise<OperationReturn<Ops> | ValidationFailureResponse>
  _ops: Ops
} {
  type OperationKey = Extract<keyof Ops, string>
  /** Successfully validated payload, correlated with its operation key. */
  type ValidPayload = {
    [K in OperationKey]: {
      operation: K
      data: z.output<Ops[K]["schema"]>
    }
  }[OperationKey]
  /** What the middleware stashes in router context for the action. */
  type Payload = ValidPayload | { failed: ValidationErrors }

  // A request body can only be read once, so the middleware parses it (JSON or
  // FormData, files preserved) and the action picks the validated result up
  // from router context instead of re-reading the request.
  const validatedPayload = createContext<Payload | undefined>(undefined)

  const middleware: MiddlewareFunction<Response> = async ({ request, context }, next) => {
    if (request.method === "GET" || request.method === "HEAD") {
      return await next()
    }

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

    if (typeof operation !== "string" || !Object.hasOwn(operations, operation)) {
      logger.warn(
        `[${request.method}] ${path}: unknown ${OPERATION_FIELD} ${JSON.stringify(operation)}`
      )
      return await failValidation({
        fieldErrors: {},
        formErrors: [`Unknown ${OPERATION_FIELD}: ${String(operation)}`],
      })
    }

    const result = await operations[operation as OperationKey]?.schema.safeParseAsync(fields)

    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error)
      logger.warn(
        `[${request.method}] ${path}: validation failed for operation "${operation}": ${JSON.stringify({ fieldErrors, formErrors })}`
      )
      return await failValidation({ fieldErrors, formErrors })
    }

    // `operation` is a verified registry key and `result.data` was produced by
    // that key's own schema, so the payload matches that member of the union —
    // a correlation TypeScript cannot express for the widened string lookup.
    context.set(validatedPayload, { data: result.data, operation } as ValidPayload)

    return next()
  }

  function validationErrorsToMessage(errors: ValidationErrors): string {
    const fieldMessages = Object.entries(errors.fieldErrors).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => `${field}: ${message}`)
    )

    return [...errors.formErrors, ...fieldMessages].join("\n")
  }

  // Correlates the operation key with its own schema's output type, so each
  // registered action receives exactly the data its own schema produced.
  // (Correlation between schema and action is already enforced by `validate`.)
  async function dispatch<K extends OperationKey>(
    operation: K,
    args: ActionFunctionArgs,
    data: z.output<Ops[K]["schema"]>
  ): Promise<OperationReturn<Ops>> {
    // `operations[operation]` resolves through the `Record<string,
    // ValidatedOperation>` constraint, which erases the action's return type —
    // restore it. Sound because `validate` guarantees the schema/action/return
    // pairing for every registry entry.
    const { action } = operations[operation] as ValidatedOperation<
      Ops[K]["schema"],
      OperationReturn<Ops>
    >
    return action(args, data)
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
      // Returned (not thrown) so the failure lands in `actionData` for the UI
      // to render; the 400 status also skips post-action loader revalidation.
      return data(
        {
          errors: payload.failed,
          message: validationErrorsToMessage(payload.failed),
          success: false,
        },
        { status: 400 }
      )
    }

    return dispatch(payload.operation, args, payload.data)
  }

  return { _ops: operations, action, middleware }
}

/** Union of the (awaited) return types of all registered actions. */
type OperationReturn<Ops extends Record<string, ValidatedOperation>> = {
  [K in keyof Ops]: Awaited<ReturnType<Ops[K]["action"]>>
}[keyof Ops]
