import { INSTANCE_UUID_BUN_FILE } from "./constants";
import type {
  InstanceUUIDFailure,
  InstanceUUIDResult,
  InstanceUUIDSuccess,
} from "./instanceUUIDtypes";

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
