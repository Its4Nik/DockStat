import type { themeType } from "@dockstat/theme-handler/server"
import { fail, ok, type RouteArgs } from "../lib/http"
import Singletons from "../singletons"

const themeResponse = (theme: themeType, message: string) =>
  ok({ data: theme, message, success: true })

export const ThemeLoaders = {
  byId: ({ params }: RouteArgs<{ id: string }>) => {
    const id = Number(params.id)
    if (Number.isNaN(id)) return fail(400, "Invalid theme ID")
    const theme = Singletons.Themes.getThemeDB().getTheme(undefined, id)
    if (!theme) return fail(404, `Theme with id ${id} not found`)
    return themeResponse(theme, `Found theme with id ${id}`)
  },
  byName: ({ params }: RouteArgs<{ name: string }>) => {
    const theme = Singletons.Themes.getThemeDB().getTheme(params.name)
    if (!theme) return fail(404, `Theme with name "${params.name}" not found`)
    return themeResponse(theme, `Found theme "${params.name}"`)
  },
  defaultTheme: () => {
    const themes = Singletons.Themes.getThemeDB().getAllThemes()
    return themes.find((theme) => theme.id === -4) ?? themes[0]
  },
  list: () => {
    const themes = Singletons.Themes.getThemeDB().getAllThemes()
    return { data: themes, message: `Found ${themes.length} theme(s)`, success: true }
  },
}
