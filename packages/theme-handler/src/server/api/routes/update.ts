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
            error: "Invalid theme ID",
            success: false as const,
          })
        }

        const existing = themeDB.getTheme(undefined, id)
        if (!existing) {
          return status(404, {
            error: `Theme with id ${id} not found`,
            success: false as const,
          })
        }

        // Check name conflict if name is being changed
        if (body.name && body.name !== existing.name) {
          const nameConflict = themeDB.getTheme(body.name)
          if (nameConflict) {
            return status(409, {
              error: `Theme with name "${body.name}" already exists`,
              success: false as const,
            })
          }
        }

        themeDB.updateTheme(id, {
          animations: body.animations,
          name: body.name,
          variables: body.variables,
        })

        const updated = themeDB.getTheme(undefined, id)
        if (!updated) {
          return status(500, {
            error: "Failed to retrieve updated theme",
            success: false as const,
          })
        }

        return status(200, {
          data: updated,
          message: `Theme "${updated.name}" updated successfully`,
          success: true as const,
        })
      } catch (error) {
        return status(500, {
          error: error instanceof Error ? error.message : "Failed to update theme",
          success: false as const,
        })
      }
    },
    {
      body: theme.model.post,
      params: t.Object({
        id: t.String(),
      }),
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
