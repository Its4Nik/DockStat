import {
	DockStatConfigTable,
	UpdateDockStatConfigTableResponse,
} from "@dockstat/typings/schemas"
import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { t } from "elysia"
import { config } from "../plugins/default-plugins/dockmon/src/config"

export namespace DatabaseModel {
	export const updateBody = DockStatConfigTable
	export type updateBody = DockStatConfigTableType

	export const updateRes = UpdateDockStatConfigTableResponse
	export type updateRes = typeof UpdateDockStatConfigTableResponse.static

	export const configRes = DockStatConfigTable

	export const error = t.Literal("Error while opening Database")
	export const updateError = t.Object({
		message: t.Literal("Error while updating Database"),
		error: t.Unknown(),
	})

	export const configResponses = t.Object({
		200: configRes,
		400: error,
	})
}
