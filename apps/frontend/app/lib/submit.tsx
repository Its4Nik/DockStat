import { useSubmit, type ActionFunctionArgs } from "react-router"
import type z from "zod"

export const OPERATION_FIELD = "__operation__"
export const PAYLOAD_FIELD = "__payload"

interface ValidatedOperation<Schema extends z.ZodType = z.ZodType, R = unknown> {
  schema: Schema
  action(args: ActionFunctionArgs, data: z.output<Schema>): R
}

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

export const submit = <Ops extends Record<string, ValidatedOperation>, K extends keyof Ops = keyof Ops>(
  operation: K,
  action?: string,
) => {
  const targetAction = action
    ? action.startsWith("/api/v3/")
      ? action
      : `/api/v3/${action.replace(/^\/+/, "")}`
    : "/api/v3/globalactions"
  return (sub: ReturnType<typeof useSubmit>) => {
    const submitFunc = (payload: z.input<Ops[K]["schema"]>) => {
      let serializedPayload: string | undefined

      try {
        serializedPayload = JSON.stringify(payload)
      } catch (error) {
        console.error(`[submit] Failed to serialize operation "${operation.toString()}" payload`, error)
        throw error
      }

      const submission = sub(
        { [OPERATION_FIELD]: operation.toString(), [PAYLOAD_FIELD]: serializedPayload },
        { action: targetAction, encType: "application/json", method: "post", navigate: false }
      )
      void submission.catch((error) => {
        console.error(`[submit] Operation "${operation.toString()}" failed`, error)
      })
      return submission
    }
    return submitFunc
  }
}
