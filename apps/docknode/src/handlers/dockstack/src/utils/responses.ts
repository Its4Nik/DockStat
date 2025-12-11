// src/responses.ts
export async function createSuccessResponse<T>(message: string, data?: T) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  } as const
}

export async function createErrorResponse(message: string, code: string, details?: string) {
  return {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    error: { code, details },
  } as const
}
