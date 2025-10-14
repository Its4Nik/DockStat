import { dockStackLogger } from "../..";
import { dockNodeAuthHandlerLogger } from "./loggers";

type InstanceUUIDSuccess = {
  message: string;
  data: { uuid: string };
  code: { success: true; file?: boolean };
};

type InstanceUUIDFailure = {
  message: string;
  data: null;
  code: { success: false; file?: boolean };
};

type InstanceUUIDResult = InstanceUUIDSuccess | InstanceUUIDFailure;

const INSTANCE_UUID_PATH = "./.dockstacks_instance_uuid.txt";
const INSTANCE_UUID_BUN_FILE = Bun.file(INSTANCE_UUID_PATH);

function normalizeError(err: unknown): { message: string; original?: unknown } {
  if (err instanceof Error) return { message: err.message, original: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

/** Type guards */
function isSuccess(r: InstanceUUIDResult): r is InstanceUUIDSuccess {
  return Boolean(
    (r as InstanceUUIDSuccess).code?.success === true &&
      (r as InstanceUUIDSuccess).data?.uuid
  );
}

export async function createSuccessResponse<T>(message: string, data?: T) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  } as const;
}

export async function createErrorResponse(
  message: string,
  code: string,
  details?: string
) {
  return {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    error: { code, details },
  } as const;
}

/** Create a new instance UUID file. Returns a well-typed object. */
export async function createInstanceUUID(): Promise<InstanceUUIDResult> {
  if (await INSTANCE_UUID_BUN_FILE.exists()) {
    return {
      message: "UUID file already exists. Please call 'getInstanceUUID()'.",
      data: null,
      code: { success: false, file: true },
    };
  }

  const uuid = crypto.randomUUID();
  await INSTANCE_UUID_BUN_FILE.write(uuid);

  return {
    message: "UUID created successfully.",
    data: { uuid },
    code: { success: true },
  };
}

/** Read the instance UUID file (if present). */
export async function getInstanceUUID(): Promise<InstanceUUIDResult> {
  if (!(await INSTANCE_UUID_BUN_FILE.exists())) {
    return {
      message: "UUID file does not exist. Please call 'createInstanceUUID()'.",
      data: null,
      code: { success: false, file: false },
    };
  }

  const text = await INSTANCE_UUID_BUN_FILE.text();

  return {
    message: "UUID file read successfully.",
    data: { uuid: text },
    code: { success: true },
  };
}

/**
 * Get the default auth key (instance UUID).
 * - If file exists, returns it.
 * - If file missing, creates it and returns the new uuid.
 * - Throws on unrecoverable errors.
 */
export async function getDefaultAuthKey(): Promise<string> {
  dockNodeAuthHandlerLogger.info("Getting Default PSK");

  try {
    const res = await getInstanceUUID();

    // If we already have a successful response, return the uuid
    if (isSuccess(res)) {
      dockStackLogger.debug(res.message);
      return res.data.uuid;
    }

    // If the file is missing (file === false), create it
    if (res.code.file === false) {
      dockStackLogger.warn("No Instance ID found, creating...");
      const created = await createInstanceUUID();

      if (isSuccess(created)) {
        dockStackLogger.debug(created.message);
        return created.data.uuid;
      }

      dockStackLogger.error(
        `Failed to create Instance UUID: ${created.message}`
      );
      throw new Error(created.message);
    }

    dockStackLogger.error(`Unexpected getInstanceUUID result: ${res.message}`);
    throw new Error(res.message);
  } catch (err: unknown) {
    const normalized = normalizeError(err);
    dockStackLogger.error(`getDefaultAuthKey error: ${normalized.message}`);
    throw err;
  }
}
