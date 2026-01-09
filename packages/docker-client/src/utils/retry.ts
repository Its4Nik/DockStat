/**
 * Retry a failing async operation up to a specified number of attempts with a fixed delay.
 *
 * Example:
 *   const result = await withRetry(
 *     () => fetchData(),
 *     3,           // attempts
 *     1000         // delay in ms between attempts
 *   )
 *
 * If all attempts fail, the last encountered error is re-thrown.
 *
 * @param operation - A function returning a Promise that will be retried on failure.
 * @param attempts - Total number of attempts to try the operation.
 * @param delay - Delay in milliseconds between attempts.
 * @returns The resolved value of the operation if it succeeds within the given attempts.
 * @throws The last encountered error if all attempts fail, or a generic error if no attempts were made.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  attempts: number,
  delay: number
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === attempts) {
        throw lastError
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("No attempts made")
}
