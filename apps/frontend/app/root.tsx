import { Outlet } from "react-router"
import type { Route } from "./+types/root"
import "./app.css"
import "@dockstat/ui/css"
import { type AuthUser, authContext, createAuthMiddleware } from "@dockstat/auth/react-router"
import { applyThemeToDocument, loadThemePreference } from "@dockstat/theme-handler/client"
import type { themeType } from "@dockstat/theme-handler/server"
import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { useFetchers, useNavigation } from "react-router"
import Loaders from "./.server/loader"
import Singletons from "./.server/singletons"
import { Auth } from "./.server/singletons/auth"

export { ErrorBoundary, Layout } from "./layout"

/**
 * Authenticates every request exactly once, publishes the user through
 * router context (SSR-optimized: loaders/actions read it for free) and
 * slides the session cookie forward when it passes half its lifetime.
 */
export const middleware: Route.MiddlewareFunction[] = [createAuthMiddleware(Auth)]

export const loader = async ({ context }: Route.LoaderArgs) => {
  let theme = Loaders.Themes.defaultTheme()
  const themes = Loaders.Themes.list().data
  const navLinks = Loaders.DB.getConfig().nav_links
  const themePreference = loadThemePreference()
  const authenticated = context.get(authContext)

  if (themePreference?.id) {
    const dbTheme = Singletons.DB._sqliteWrapper
      .table<themeType>("themes")
      .select(["variables"])
      .where({ id: themePreference.id })
      .get()
    if (dbTheme) theme = dbTheme
  }

  const res = {
    authenticated,
    theme,
    themes,
    nav: {
      links: navLinks || []
    }
  }

  return res
}

export type RootContext = {
  theme: {
    currentTheme: themeType
    allThemes: themeType[]
    setTheme: React.Dispatch<React.SetStateAction<themeType>>
  }
  busy: boolean
  auth: {
    user: AuthUser | null
    set: Dispatch<SetStateAction<AuthUser | null>>
  }
  nav: {
    links: {
      slug: string;
      path: string;
    }[]
  }
}

export default function App({ loaderData }: Route.ComponentProps) {
  const [currentTheme, setCurrentTheme] = useState(loaderData.theme)
  const [isAuthenticated, setIsAuthenticated] = useState<AuthUser | null>(loaderData.authenticated)
  const navigationBusy = useNavigation().state !== "idle"
  const fetchersBusy = useFetchers().some((fetcher) => fetcher.state !== "idle")
  const globalBusy = navigationBusy || fetchersBusy

  useEffect(() => {
    if (typeof window !== "undefined" && currentTheme !== undefined) {
      applyThemeToDocument(currentTheme?.variables || {})
    }
  }, [currentTheme])

  useEffect(() => {
    setIsAuthenticated(loaderData.authenticated)
  }, [loaderData.authenticated])

  return (
    <Outlet
      context={
        {
          auth: {
            set: setIsAuthenticated,
            user: isAuthenticated,
          },
          busy: globalBusy,
          theme: {
            currentTheme,
            allThemes: loaderData.themes,
            setTheme: setCurrentTheme,
          },
          nav: {
            links: loaderData.nav.links,
          }
        } satisfies RootContext
      }
    />
  )
}
