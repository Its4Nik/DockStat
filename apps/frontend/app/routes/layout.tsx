import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import { Outlet, useOutletContext } from "react-router"
import type { Route } from "./+types/layout"
import { Navbar } from "@dockstat/ui"
import type { RootContext } from "~/root"
import { executeAction } from "~/lib/executeAction"

/**
 * Protected layout: every route nested here requires an authenticated
 * session. Unauthenticated document requests redirect to /login; API-ish
 * requests (JSON accept header or /api paths) get a 401 JSON body.
 */
export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ loginPath: "/login" }),
]

export default function Layout() {
  const { auth, theme, busy,nav } = useOutletContext<RootContext>()
  const pin = ({ path, slug }: { path: string; slug: string }) =>
    executeAction["Config.Pin.pin"]({ body: { path, slug } }).then(() => undefined)
  const unpin = ({ path, slug }: { path: string; slug: string }) =>
    executeAction["Config.Pin.unpin"]({ body: { path, slug } }).then(() => undefined)

  const applyColor = (key: string, value: string) => {
    if (typeof document === "undefined") return
    const root = document.documentElement

    root.style.setProperty(key.startsWith("--") ? key : `--${key}`, value)
  }

  return (
    <div className="min-h-screen bg-main-bg">
      <Navbar
        themes={theme.allThemes}
        currentThemeId={theme.currentTheme?.id || 0}
        onSelectTheme={(th) => theme.setTheme({ ...th, animations: {}})}
        deleteTheme={() => Promise.resolve()}
        auth={{user: auth.user?.name || auth.user?.email || auth.user?.sub || null , logout: () => auth}}
        ramUsage="--"
        ramRefreshKey={0}
        sidebarHotkeys={{
          toggle: "Cmd+K",
          open: "Cmd+B",
          close: "Escape",
        }}
        mutationFn={{
          isBusy: busy,
          pin,
          unpin,
        }}
        isBusy={busy}
        onColorChange={applyColor}
        logEntries={[]}
        pluginLinks={[]}
        setIsThemeSidebarOpen={() => { }}
        toastSuccess={() => { }}
        navLinks={nav.links}
      />

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
