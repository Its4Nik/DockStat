// src/getDefaultAuthKey.ts
import { Replace } from "elysia/dist/types"
import { dockStackLogger } from "../.."
import { createInstanceUUID, getInstanceUUID } from "./createResponses"
import { type InstanceUUIDSuccess, isInstanceUUID } from "./instanceUUIDtypes"
import { dockNodeAuthHandlerLogger } from "./loggers"

/**
 * Get the default auth key (instance UUID).
 * - If file exists, returns it.
 * - If file missing, creates it and returns the new uuid.
 * - Throws on unrecoverable errors.
 */

type DockStackAuthVariations = "DevEnv" | "ProdEnv" | "InstanceUUID"

function isDockStackPriorityList(r: unknown): r is DockStackAuthVariations {
  return Boolean(
    Array.isArray(String(r).split(",")) &&
      (r as DockStackAuthVariations[]).find((k) => k === "DevEnv") &&
      (r as DockStackAuthVariations[]).find((k) => k === "InstanceUUID") &&
      (r as DockStackAuthVariations[]).find((k) => k === "ProdEnv")
  )
}

export async function getDefaultAuthKey(): Promise<string> {
  const DockStackProdAuthKey = Bun.env.DOCKNODE_DOCKSTACK_AUTH_PSK
  const DockStackDevAuthKey = Bun.env.DOCKNODE_DOCKSTACK_DEV_AUTH
  const DockStackAuthPriority = Bun.env.DOCKNODE_DOCKSTACK_AUTH_PRIORITY
  const InstanceUUID = await getInstanceUUID()

  // Priority List
  let AuthPriority: DockStackAuthVariations[] = ["DevEnv", "ProdEnv", "InstanceUUID"]

  dockNodeAuthHandlerLogger.debug(`Default Auth Priority: ${AuthPriority}`)

  if (DockStackAuthPriority && isDockStackPriorityList(DockStackAuthPriority)) {
    dockNodeAuthHandlerLogger.debug(`Found environment overwrite: ${DockStackAuthPriority}`)
    AuthPriority = DockStackAuthPriority.split(",") as DockStackAuthVariations[]
  }

  // Parsing Key Types
  dockNodeAuthHandlerLogger.info("Assembling DockStack Auth Variations")
  const KeyRecord: Record<DockStackAuthVariations, string> = {} as typeof KeyRecord

  if (DockStackProdAuthKey) {
    dockNodeAuthHandlerLogger.info("Has DockStackProdAuthKey")
    KeyRecord.DevEnv = DockStackProdAuthKey
  }

  if (DockStackDevAuthKey) {
    dockNodeAuthHandlerLogger.info("Has DockStackDevAuthKey")
    KeyRecord.ProdEnv = DockStackDevAuthKey
  }

  if (isInstanceUUID(InstanceUUID)) {
    dockNodeAuthHandlerLogger.info("Has a valid Instance UUID")
    KeyRecord.InstanceUUID = (InstanceUUID as InstanceUUIDSuccess).data.uuid
  }
  dockNodeAuthHandlerLogger.debug(`InstanceUUIDResponse: ${JSON.stringify(InstanceUUID)}`)

  for (const key of AuthPriority) {
    if (KeyRecord[key]) {
      return KeyRecord[key]
    }
  }

  dockNodeAuthHandlerLogger.error(`No Default Auth Key found in: ${JSON.stringify(KeyRecord)}`)

  throw new Error("No Default Auth Key found")
}
