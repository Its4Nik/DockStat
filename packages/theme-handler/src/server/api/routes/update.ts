import Elysia, { t } from "elysia"
import type { ThemeDB } from "../../db"
import { theme } from "../models"

export const createThemeUpdateRoute = (themeDB: ThemeDB) => {
  return new Elysia().decorate("themeDB", themeDB).put(
    "/:id",
    ({ themeDB, params, body, status }) => {
      try {
        const id = Number(params.id)

        if (Number.isNaN(id)) {
          return status(400, {
            success: false as const,
            error: "Invalid theme ID",
          })
        }

        const existing = themeDB.getTheme(undefined, id)
        if (!existing) {
          return status(404, {
            success: false as const,
            error: `Theme with id ${id} not found`,
          })
        }

        // Check name conflict if name is being changed
        if (body.name && body.name !== existing.name) {
          const nameConflict = themeDB.getTheme(body.name)
          if (nameConflict) {
            return status(409, {
              success: false as const,
              error: `Theme with name "${body.name}" already exists`,
            })
          }
        }

        themeDB.updateTheme(id, {
          name: body.name,
          variables: body.variables,
          animations: body.animations,
        })

        const updated = themeDB.getTheme(undefined, id)
        if (!updated) {
          return status(500, {
            success: false as const,
            error: "Failed to retrieve updated theme",
          })
        }

        return status(200, {
          success: true as const,
          message: `Theme "${updated.name}" updated successfully`,
          data: updated,
        })
      } catch (error) {
        return status(500, {
          success: false as const,
          error: error instanceof Error ? error.message : "Failed to update theme",
        })
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: theme.model.post,
      response: {
        200: theme.responses.success.default,
        400: theme.responses.error,
        404: theme.responses.error,
        409: theme.responses.error,
        500: theme.responses.error,
      },
    }
  )
}
