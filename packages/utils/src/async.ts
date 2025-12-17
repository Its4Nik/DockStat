/**
 * Async utility functions
 * @module async
 */

/**
 * Creates a debounced function that delays invocation.
 * @param fn - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, wait)
  }
}

/**
 * Creates a throttled function that only invokes at most once per wait period.
 * @param fn - Function to throttle
 * @param wait - Milliseconds to wait between invocations
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= wait) {
      lastCall = now
      fn.apply(this, args)
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn.apply(this, args)
        timeoutId = null
      }, wait - timeSinceLastCall)
    }
  }
}

/**
 * Delays execution for a specified amount of time.
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type RetryOptions = Readonly<{
  attempts?: number
  delay?: number
  backoff?: number
  onRetry?: (error: Error, attempt: number) => void
}>

/**
 * Retries a function with exponential backoff.
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Promise with the function result
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, delay = 1000, backoff = 2, onRetry } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === attempts) {
        throw lastError
      }

      onRetry?.(lastError, attempt)

      const waitTime = delay * backoff ** (attempt - 1)
      await sleep(waitTime)
    }
  }

  // unreachable, but keeps TS satisfied without unsafe assertions
  throw lastError ?? new Error("Retry failed without an error")
}

/**
 * Adds a timeout to a promise.
 * @param promise - Promise to add timeout to
 * @param ms - Timeout in milliseconds
 * @param timeoutError - Optional custom error message
 * @returns Promise that rejects if timeout is exceeded
 */
export function timeout<T>(promise: Promise<T>, ms: number, timeoutError?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError || `Operation timed out after ${ms}ms`)), ms)
    ),
  ])
}
