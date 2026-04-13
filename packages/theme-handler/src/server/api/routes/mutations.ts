import Elysia from "elysia"
import type { ThemeDB } from "../../db"
import { theme } from "../models"

export const createThemeCreationRoute = (themeDB: ThemeDB) => {
  return new Elysia().decorate("themeDB", themeDB).post(
    "/",
    ({ themeDB, body, status }) => {
      try {
        const existing = themeDB.getTheme(body.name)
        if (existing !== null) {
          return status(409, {
            error: `Theme with name "${body.name}" already exists`,
            success: false as const,
          })
        }

        themeDB.addTheme(body.name, body.animations ?? {}, body.variables ?? {})

        const created = themeDB.getTheme(body.name)
        if (!created) {
          return status(500, {
            error: "Failed to retrieve created theme",
            success: false as const,
          })
        }

        return status(201, {
          data: created,
          message: `Theme "${body.name}" created successfully`,
          success: true as const,
        })
      } catch (error) {
        return status(500, {
          error: error instanceof Error ? error.message : "Failed to create theme",
          success: false as const,
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
