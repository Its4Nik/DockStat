export type InstanceUUIDSuccess = {
  message: string
  data: { uuid: string }
  code: { success: true; file?: boolean }
}

export type InstanceUUIDFailure = {
  message: string
  data: null
  code: { success: false; file: boolean }
}

export type InstanceUUIDResult = InstanceUUIDSuccess | InstanceUUIDFailure

export type EnvKey = {
  success: boolean
  data: string | null
}

/** Type guard */
export function isInstanceUUID(r: unknown): r is InstanceUUIDSuccess {
  const pR = r as InstanceUUIDResult

  if (pR.code.success) {
    return true
  }

  return false
}
