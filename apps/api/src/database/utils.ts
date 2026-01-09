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
    message: "Updated config successfully",
    code: 200,
    update_response: updateRes,
    new_config: newConfig,
  }
}
