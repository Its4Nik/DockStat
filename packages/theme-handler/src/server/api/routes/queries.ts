import Elysia, { t } from "elysia"
import type { ThemeDB } from "../../db"
import { theme } from "../models"

export const createThemeQueryRoutes = (themeDB: ThemeDB) => {
  return new Elysia()
    .decorate("themeDB", themeDB)

    .get(
      "/",
      ({ themeDB, status }) => {
        try {
          const themes = themeDB.getAllThemes()
          return status(200, {
            success: true as const,
            message: `Found ${themes.length} theme(s)`,
            data: themes,
          })
        } catch (error) {
          return status(500, {
            success: false as const,
            error: error instanceof Error ? error.message : "Failed to fetch themes",
          })
        }
      },
      {
        response: {
          200: theme.responses.success.list,
          500: theme.responses.error,
        },
      }
    )

    .get(
      "/by-name/:name",
      ({ themeDB, params, status }) => {
        try {
          const theme = themeDB.getTheme(params.name)

          if (!theme) {
            return status(404, {
              success: false as const,
              error: `Theme with name "${params.name}" not found`,
            })
          }

          return status(200, {
            success: true as const,
            message: `Found theme "${params.name}"`,
            data: theme,
          })
        } catch (error) {
          return status(500, {
            success: false as const,
            error: error instanceof Error ? error.message : "Failed to fetch theme",
          })
        }
      },
      {
        params: t.Object({
          name: t.String(),
        }),
        response: {
          200: theme.responses.success.default,
          404: theme.responses.error,
          500: theme.responses.error,
        },
      }
    )

    .get(
      "/by-id/:id",
      ({ themeDB, params, status }) => {
        try {
          const id = Number(params.id)

          if (Number.isNaN(id)) {
            return status(400, {
              success: false as const,
              error: "Invalid theme ID",
            })
          }

          const theme = themeDB.getTheme(undefined, id)

          if (!theme) {
            return status(404, {
              success: false as const,
              error: `Theme with id ${id} not found`,
            })
          }

          return status(200, {
            success: true as const,
            message: `Found theme with id ${id}`,
            data: theme,
          })
        } catch (error) {
          return status(500, {
            success: false as const,
            error: error instanceof Error ? error.message : "Failed to fetch theme",
          })
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: theme.responses.success.default,
          400: theme.responses.error,
          404: theme.responses.error,
          500: theme.responses.error,
        },
      }
    )
}
