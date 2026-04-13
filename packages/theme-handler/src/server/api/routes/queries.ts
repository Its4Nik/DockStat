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
            data: themes,
            message: `Found ${themes.length} theme(s)`,
            success: true as const,
          })
        } catch (error) {
          return status(500, {
            error: error instanceof Error ? error.message : "Failed to fetch themes",
            success: false as const,
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
              error: `Theme with name "${params.name}" not found`,
              success: false as const,
            })
          }

          return status(200, {
            data: theme,
            message: `Found theme "${params.name}"`,
            success: true as const,
          })
        } catch (error) {
          return status(500, {
            error: error instanceof Error ? error.message : "Failed to fetch theme",
            success: false as const,
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
              error: "Invalid theme ID",
              success: false as const,
            })
          }

          const theme = themeDB.getTheme(undefined, id)

          if (!theme) {
            return status(404, {
              error: `Theme with id ${id} not found`,
              success: false as const,
            })
          }

          return status(200, {
            data: theme,
            message: `Found theme with id ${id}`,
            success: true as const,
          })
        } catch (error) {
          return status(500, {
            error: error instanceof Error ? error.message : "Failed to fetch theme",
            success: false as const,
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
