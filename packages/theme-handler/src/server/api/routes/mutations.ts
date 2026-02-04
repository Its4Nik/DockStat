import Elysia from "elysia"
import type { ThemeDB } from "../../db"
import { theme } from "../models"

export const createThemeCreationRoute = (themeDB: ThemeDB) => {
  return new Elysia().decorate("themeDB", themeDB).post(
    "/",
    ({ themeDB, body, status }) => {
      try {
        const existing = themeDB.getTheme(body.name)
        if (existing === null) {
          return status(409, {
            success: false as const,
            error: `Theme with name "${body.name}" already exists`,
          })
        }

        themeDB.addTheme(body.name, body.animations ?? {}, body.variables ?? {})

        const created = themeDB.getTheme(body.name)
        if (!created) {
          return status(500, {
            success: false as const,
            error: "Failed to retrieve created theme",
          })
        }

        return status(201, {
          success: true as const,
          message: `Theme "${body.name}" created successfully`,
          data: created,
        })
      } catch (error) {
        return status(500, {
          success: false as const,
          error: error instanceof Error ? error.message : "Failed to create theme",
        })
      }
    },
    {
      body: theme.model.post,
      response: {
        201: theme.responses.success.default,
        409: theme.responses.error,
        500: theme.responses.error,
      },
    }
  )
}
