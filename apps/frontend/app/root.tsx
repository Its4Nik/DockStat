import {
  Outlet,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import "@dockstat/ui/css"
import Loaders from "./.server/loader";
import { useEffect, useState } from "react";
import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import Singletons from "./.server/singletons";
import type { themeType } from "@dockstat/theme-handler/server";
import { useNavigation } from "react-router";

export { ErrorBoundary, Layout } from "./layout";

export const loader = () => {
  let theme = Loaders.Themes.defaultTheme()
  const themePreference = loadThemePreference()

  if (themePreference?.id) {
    const dbTheme = Singletons.DB._sqliteWrapper.table<themeType>("themes").select(["variables"]).where({ id: themePreference.id }).get()
    if (dbTheme) theme = dbTheme
  }

  const outletContext = {
    theme
  }

  return outletContext
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
}

export default function App({ loaderData }: Route.ComponentProps) {
  const [currentTheme, setCurrentTheme] = useState(loaderData.theme);
  const globalBusy = useNavigation().state !== "idle"

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyThemeToDocument(currentTheme.variables, (msg) => console.log(msg))
    }
  }, [currentTheme])

  return <Outlet context={{
    theme: currentTheme,
    setTheme: setCurrentTheme,
    busy: globalBusy
  } satisfies RootContext}/>;
}
