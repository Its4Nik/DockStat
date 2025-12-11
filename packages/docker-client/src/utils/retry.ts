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
