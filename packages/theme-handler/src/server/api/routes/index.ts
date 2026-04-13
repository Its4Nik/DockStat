import Elysia from "elysia"
import type { ThemeDB } from "../../db"
import { createThemeDeleteRoute } from "./delete"
import { createThemeCreationRoute } from "./mutations"
import { createThemeQueryRoutes } from "./queries"
import { createThemeUpdateRoute } from "./update"

export const createThemeRoutes = (themeDB: ThemeDB) =>
  new Elysia({
    detail: {
      tags: ["Themes"],
    },
    name: "@dockstat/theme-handler",
    prefix: "/themes",
  })
    .use(createThemeQueryRoutes(themeDB))
    .use(createThemeCreationRoute(themeDB))
    .use(createThemeUpdateRoute(themeDB))
    .use(createThemeDeleteRoute(themeDB))
