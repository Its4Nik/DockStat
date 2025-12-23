import { DockStatConfigTable, UpdateDockStatConfigTableResponse } from "@dockstat/typings/schemas"
import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { t } from "elysia"

export namespace DatabaseModel {
  export const updateBody = DockStatConfigTable
  export type updateBody = DockStatConfigTableType

  export const updateRes = UpdateDockStatConfigTableResponse
  export type updateRes = typeof UpdateDockStatConfigTableResponse.static

  export const configRes = DockStatConfigTable

  export const error = t.Object({
    success: t.Literal(false),
    error: t.String(),
    message: t.String(),
  })

  export const updateError = t.Object({
    success: t.Literal(false),
    message: t.String(),
    error: t.String(),
  })

  export const configResponses = t.Object({
    200: configRes,
    400: error,
  })
}
