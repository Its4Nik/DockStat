import Elysia, { t } from "elysia"
import type { ThemeDB } from "../../db"
import { theme } from "../models"

export const createThemeDeleteRoute = (themeDB: ThemeDB) => {
  return new Elysia().decorate("themeDB", themeDB).delete(
    "/",
    ({ themeDB, status, body }) => {
      try {
        const id = Number(body.id)

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
      body: t.Object({
        id: t.Number(),
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
