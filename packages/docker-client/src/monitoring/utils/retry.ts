export async function withRetry<T>(
	operation: () => Promise<T>,
	retryAttempts: number,
	retryDelay: number
): Promise<T> {
	let lastError: Error | null = null
	for (let attempt = 1; attempt <= retryAttempts; attempt++) {
		try {
			return await operation()
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))
			if (attempt === retryAttempts && lastError) {
				throw lastError
			}
			await new Promise((resolve) => setTimeout(resolve, retryDelay))
		}
	}
	throw new Error("Unexpected retry logic failure")
}
