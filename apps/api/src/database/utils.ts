import { DockStatDB } from "."
import type { DatabaseModel } from "../models/database"

export function updateConfig(config: DatabaseModel.updateBody) {
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
