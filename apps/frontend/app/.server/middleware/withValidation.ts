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
 */
export function validate<Schema extends z.ZodType, R>(
  schema: Schema,
  action: ValidatedAction<Schema, R>
): ValidatedOperation<Schema, R> {
  return { action, schema }
}

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
 * Reads a mutation request body as a plain object.
 */
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {

    const parsed: unknown = await request.json()
    if ((parsed as Record<string, unknown>).__payload !== undefined) {
      const rawPayload = (parsed as Record<string, unknown>).__payload
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

/**
 * Union of the (awaited) return types of all registered actions.
 */
type OperationReturn<Ops extends Record<string, ValidatedOperation>> = {
  [K in keyof Ops]: Awaited<ReturnType<Ops[K]["action"]>>
}[keyof Ops]

export function withValidation<Ops extends Record<string, ValidatedOperation>>(
  operations: Ops
): {
  middleware: MiddlewareFunction<Response>
  action: (args: ActionFunctionArgs) => Promise<OperationReturn<Ops> | ValidationFailureResponse>
  _ops: Ops
} {
  type OperationKey = Extract<keyof Ops, string>
  type ValidPayload = {
    [K in OperationKey]: {
      operation: K
      data: z.output<Ops[K]["schema"]>
    }
  }[OperationKey]
  type Payload = ValidPayload | { failed: ValidationErrors }

  const validatedPayload = createContext<Payload | undefined>(undefined)

  // Middleware and 'readBody' remain the same...
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
      BaseLogger.spawn("Validation").warn(`[${request.method}] ${path}: malformed request body`)
      return await failValidation({ fieldErrors: {}, formErrors: ["Malformed request body"] })
    }

    const { [OPERATION_FIELD]: operation, ...fields } = raw

    if (typeof operation !== "string" || !Object.hasOwn(operations, operation)) {
      BaseLogger.spawn("Validation").warn(
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
      BaseLogger.spawn("Validation").warn(
        `[${request.method}] ${path}: validation failed for operation "${operation}": ${JSON.stringify({ fieldErrors, formErrors })}`
      )
      return await failValidation({ fieldErrors, formErrors })
    }

    context.set(validatedPayload, { data: result.data, operation } as ValidPayload)
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

    const { action: opAction } = operations[payload.operation] as ValidatedOperation<
      Ops[typeof payload.operation]["schema"],
      OperationReturn<Ops>
    >
    return opAction(args, payload.data)
  }

  return { _ops: operations, action, middleware }
}
