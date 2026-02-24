import Elysia, { t } from "elysia"
import type { ThemeDB } from "../../db"
import { theme } from "../models"

export const createThemeDeleteRoute = (themeDB: ThemeDB) => {
  return new Elysia().decorate("themeDB", themeDB).delete(
    "/:id",
    ({ themeDB, params, status }) => {
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

        themeDB.deleteTheme(id)

        return status(200, {
          success: true as const,
          message: `Theme "${existing.name}" deleted successfully`,
        })
      } catch (error) {
        return status(500, {
          success: false as const,
          error: error instanceof Error ? error.message : "Failed to delete theme",
        })
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: theme.responses.success.delete,
        400: theme.responses.error,
        404: theme.responses.error,
        500: theme.responses.error,
      },
    }
  )
}
