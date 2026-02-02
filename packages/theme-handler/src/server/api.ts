import Elysia, { t } from "elysia"
import type { ThemeDB } from "./db"
import type { themeType } from "./types"

/**
 * Theme response model for OpenAPI documentation
 */
const ThemeModel = t.Object({
  id: t.Number(),
  name: t.String(),
  variables: t.Record(t.String(), t.String()),
  animations: t.Record(t.String(), t.Record(t.String(), t.Union([t.String(), t.Number()]))),
})

const ThemeNotFoundError = t.Object({
  success: t.Literal(false),
  error: t.String(),
})

const ThemeSuccessResponse = t.Object({
  success: t.Literal(true),
  message: t.String(),
  data: ThemeModel,
})

const ThemeListResponse = t.Object({
  success: t.Literal(true),
  message: t.String(),
  data: t.Array(ThemeModel),
})

const ThemeDeleteResponse = t.Object({
  success: t.Literal(true),
  message: t.String(),
})

/**
 * Creates the theme routes Elysia instance.
 *
 * The ThemeDB is passed in via `.decorate()` so routes have access to it.
 * This allows the routes to remain decoupled from the DB initialization.
 */
export const createThemeRoutes = (themeDB: ThemeDB) => {
  return (
    new Elysia({
      prefix: "/themes",
      name: "@dockstat/theme-handler",
      detail: {
        tags: ["Themes"],
      },
    })
      .decorate("themeDB", themeDB)

      // ==================== Get all themes ====================
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
            200: ThemeListResponse,
            500: ThemeNotFoundError,
          },
        }
      )

      // ==================== Get theme by name ====================
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
            200: ThemeSuccessResponse,
            404: ThemeNotFoundError,
            500: ThemeNotFoundError,
          },
        }
      )

      // ==================== Get theme by ID ====================
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
            200: ThemeSuccessResponse,
            400: ThemeNotFoundError,
            404: ThemeNotFoundError,
            500: ThemeNotFoundError,
          },
        }
      )

      // ==================== Create a new theme ====================
      .post(
        "/",
        ({ themeDB, body, status }) => {
          try {
            // Check if theme with same name exists
            const existing = themeDB.getTheme(body.name)
            if (existing) {
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
          body: t.Object({
            name: t.String(),
            variables: t.Optional(t.Record(t.String(), t.String())),
            animations: t.Optional(
              t.Record(t.String(), t.Record(t.String(), t.Union([t.String(), t.Number()])))
            ),
          }),
          response: {
            201: ThemeSuccessResponse,
            409: ThemeNotFoundError,
            500: ThemeNotFoundError,
          },
        }
      )

      // ==================== Update a theme ====================
      .put(
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
          body: t.Object({
            name: t.Optional(t.String()),
            variables: t.Optional(t.Record(t.String(), t.String())),
            animations: t.Optional(
              t.Record(t.String(), t.Record(t.String(), t.Union([t.String(), t.Number()])))
            ),
          }),
          response: {
            200: ThemeSuccessResponse,
            400: ThemeNotFoundError,
            404: ThemeNotFoundError,
            409: ThemeNotFoundError,
            500: ThemeNotFoundError,
          },
        }
      )

      // ==================== Delete a theme ====================
      .delete(
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
            200: ThemeDeleteResponse,
            400: ThemeNotFoundError,
            404: ThemeNotFoundError,
            500: ThemeNotFoundError,
          },
        }
      )
  )
}

export type ThemeRoutesType = ReturnType<typeof createThemeRoutes>
