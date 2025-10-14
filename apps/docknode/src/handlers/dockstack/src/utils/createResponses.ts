import type { ErrorResponse, SuccessResponse } from "../types";

const INSTANCE_UUID_PATH = "./.dockstacks_instance_uuid.txt";
const INSTANCE_UUID_BUN_FILE = Bun.file(INSTANCE_UUID_PATH);

export const createSuccessResponse = <T>(
  message: string,
  data?: T
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

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

export async function getInstanceUUID() {
  if (!(await INSTANCE_UUID_BUN_FILE.exists())) {
    return {
      message: "UUID File does not exist. Please class 'createInstanceUUID()'",
      code: { file: false, success: false },
      data: null,
    };
  }
  const data = await INSTANCE_UUID_BUN_FILE.text();
  return {
    message: "UUID file read succesfulley.",
    data: data,
    code: { success: true },
  };
}
