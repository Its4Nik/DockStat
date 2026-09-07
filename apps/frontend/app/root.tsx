import {
  Outlet,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import "@dockstat/ui/css"
import Loaders from "./.server/loader";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  applyThemeToDocument,
  loadThemePreference,
} from "@dockstat/theme-handler/client"
import Singletons from "./.server/singletons";
import type { themeType } from "@dockstat/theme-handler/server";
import { useNavigation } from "react-router";
import { authenticate, type AuthUser } from "./.server/lib/authenticate";

export { ErrorBoundary, Layout } from "./layout";

export const loader = async ({request}: Route.LoaderArgs) => {
  let theme = Loaders.Themes.defaultTheme()
  const themePreference = loadThemePreference()
  const authenticated = await authenticate(request)

  if (themePreference?.id) {
    const dbTheme = Singletons.DB._sqliteWrapper.table<themeType>("themes").select(["variables"]).where({ id: themePreference.id }).get()
    if (dbTheme) theme = dbTheme
  }



  const res = {
    theme,
    authenticated
  }

  return res
}

// export const links: Route.LinksFunction = () => [
//   { rel: "preconnect", href: "https://fonts.googleapis.com" },
//   {
//     rel: "preconnect",
//     href: "https://fonts.gstatic.com",
//     crossOrigin: "anonymous",
//   },
//   {
//     rel: "stylesheet",
//     href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
//   },
// ];

export type RootContext = {
  theme: themeType
  setTheme: React.Dispatch<React.SetStateAction<themeType>>
  busy: boolean
  auth: {
    user: AuthUser | null,
    set: Dispatch<SetStateAction<AuthUser | null>>
  }
}

export default function App({ loaderData }: Route.ComponentProps) {
  const [currentTheme, setCurrentTheme] = useState(loaderData.theme);
  const [isAuthenticated, setIsAuthenticated] = useState<AuthUser | null>(loaderData.authenticated)
  const globalBusy = useNavigation().state !== "idle"

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyThemeToDocument(currentTheme.variables)
    }
  }, [currentTheme])

  useEffect(() => {
    setIsAuthenticated(loaderData.authenticated)
  },[loaderData.authenticated])

  return <Outlet context={{
    theme: currentTheme,
    setTheme: setCurrentTheme,
    auth: {
      user: isAuthenticated,
      set: setIsAuthenticated
    },
    busy: globalBusy
  } satisfies RootContext}/>;
}
