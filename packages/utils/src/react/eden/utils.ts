import { extractEdenError } from "@dockstat/utils"

export async function handleEdenMutation<T>(
  promise: Promise<{ data: T; error: unknown }>
): Promise<T> {
  const { data, error } = await promise

  if (error) {
    throw new Error(extractEdenError({ error }))
  }

  // Handle logical errors returned as 200 OK but with success: false
  const potentialError = data as { success?: boolean; message?: string }
  if (potentialError.success === false) {
    throw new Error(potentialError.message || extractEdenError({ data }))
  }

  return data
}
