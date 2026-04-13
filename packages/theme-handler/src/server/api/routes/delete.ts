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

        themeDB.deleteTheme(id)

        return status(200, {
          message: `Theme "${existing.name}" deleted successfully`,
          success: true as const,
        })
      } catch (error) {
        return status(500, {
          error: error instanceof Error ? error.message : "Failed to delete theme",
          success: false as const,
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
