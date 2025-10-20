import type { ErrorResponse, SuccessResponse } from "../types";
import type { InstanceUUIDResult } from "./instanceUUIDtypes";

const INSTANCE_UUID_PATH = "./.dockstacks_instance_uuid.txt";
const INSTANCE_UUID_BUN_FILE = Bun.file(INSTANCE_UUID_PATH);

/**
 * Creates a standardized success response object
 * @template T - The type of the data payload
 * @param {string} message - A descriptive message about the successful operation
 * @param {T} [data] - Optional data payload to be included in the response
 * @returns {SuccessResponse<T>} A success response object with the message, data, and timestamp
 */
export const createSuccessResponse = <T>(
  message: string,
  data?: T
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Creates a standardized error response object
 * @param {string} message - A descriptive error message
 * @param {string} code - An error code identifying the type of error
 * @param {string} [details] - Optional additional details about the error
 * @returns {ErrorResponse} An error response object with the message, code, details, and timestamp
 */
export const createErrorResponse = (
  message: string,
  code: string,
  details?: string
): ErrorResponse => ({
  success: false,
  message,
  timestamp: new Date().toISOString(),
  error: {
    code,
    details,
  },
});

/**
 * Creates a new UUID for the instance and saves it to a file
 * @returns {Promise<{
 *   message: string,
 *   data?: { uuid: string },
 *   code: { success: boolean, file?: boolean }
 * }>} Object containing the operation result
 */
export async function createInstanceUUID() {
  if (await INSTANCE_UUID_BUN_FILE.exists()) {
    return {
      message: "UUID File already exists. Please call 'getInstanceUUID()'",
      code: { success: false, file: true },
    };
  }
  const local = { uuid: crypto.randomUUID() } as const;
  await INSTANCE_UUID_BUN_FILE.write(local.uuid);
  return {
    message: "UUID created succesfully.",
    data: {
      uuid: local.uuid,
    },
    code: {
      success: true,
    },
  };
}

/**
 * Retrieves the instance UUID from the file system
 * @returns {Promise<{
 *   message: string,
 *   uuid?: string,
 *   code: { success: boolean, file?: boolean },
 *   data?: null
 * }>} Object containing the UUID if successful, or error information if not
 */
export async function getInstanceUUID(): Promise<InstanceUUIDResult> {
  if (!(await INSTANCE_UUID_BUN_FILE.exists())) {
    return {
      message: "UUID File does not exist. Please class 'createInstanceUUID()'",
      code: { file: false, success: false },
      data: null,
    };
  }
  const data = await INSTANCE_UUID_BUN_FILE.text();
  return {
    message: "UUID file read succesfully.",
    data: {
      uuid: data,
    },
    code: { success: true },
  };
}
