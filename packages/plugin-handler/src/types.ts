export interface CompareResult {
  valid: boolean
  pluginName: string
  pluginVersion: string
  hash: string
  verified: boolean
  securityStatus: "safe" | "unsafe" | "unknown"
  verifiedBy?: string
  verifiedAt?: number
  notes?: string
  message: string
}
