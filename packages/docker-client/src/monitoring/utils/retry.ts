export async function withRetry<T>(
	operation: () => Promise<T>,
	retries: number,
	retryDelay: number
): Promise<T> {
	const maxAttempts = retries + 1

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation()
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error))
			if (attempt === maxAttempts) {
				throw err
			}
			await new Promise((resolve) => setTimeout(resolve, retryDelay))
		}
	}

	throw new Error("Unexpected retry logic failure")
}
