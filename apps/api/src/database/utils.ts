import type { DatabaseModel } from "../models/database"
import { DockStatDB } from "."

export function updateConfig(config: typeof DatabaseModel.updateBody.static) {
  const updateRes = DockStatDB.configTable
    .where({
      id: 0,
    })
    .update(config)
  const newConfig = DockStatDB.configTable
    .select(["*"])
    .where({
      id: 0,
    })
    .get()
  return {
    code: 200,
    message: "Updated config successfully",
    new_config: newConfig,
    update_response: updateRes,
  }
}
