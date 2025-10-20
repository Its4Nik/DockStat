export interface BaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface SuccessResponse<T = undefined> extends BaseResponse {
  success: true;
  data?: T;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    details?: string;
  };
}

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_TOKEN: "INVALID_TOKEN",
  MISSING_CREDENTIALS: "MISSING_CREDENTIALS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Server errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Client errors
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
} as const;

// HTTP Status Codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
