export { useLayout } from "./hooks/useLayout"

import { useAuth } from "@dockstat/auth/client"
import { Navbar, ThemeSidebar } from "@dockstat/ui"
import { useEdenClient } from "@dockstat/utils/react"
import { useCallback, useContext, useMemo } from "react"
import { useLocation } from "react-router"
import { Toaster } from "sonner"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"
import { createPinMutationHandlers } from "@/utils/createPinMutations"
import { useLayout } from "./hooks/useLayout"

const EMPTY_ARRAY: readonly never[] = []
const EMPTY_ANIMATIONS = {} as const

export function Layout({ children }: { children: React.ReactNode }): React.ReactNode {
  const { pathname } = useLocation()
  const {
    ramUsage,
    logMessagesArr,
    isBusy,
    config,
    currentThemeColors,
    currentThemeName,
    currentThemeId,
    onColorChange,
    themes,
    onSelectTheme,
    toastSuccess,
    isThemeSidebarOpen,
    setIsThemeSidebarOpen,
    frontendPluginRoutes,
    pinMutation,
    unPinMutation,
    deleteTheme,
    createNewThemeFromTheme,
    theme,
  } = useLayout()

  const { user, logout } = useAuth()

  const heading = useContext(PageHeadingContext).heading
  const edenClient = useEdenClient()
  const isLoginPage =
    pathname === "/login" || (pathname.startsWith("/auth") && pathname.endsWith("/callback"))

  const handleLogout = useCallback(() => {
    edenClient.setToken("")
    logout()
  }, [edenClient, logout])

  const handleCloseSidebar = useCallback(() => {
    setIsThemeSidebarOpen(false)
  }, [setIsThemeSidebarOpen])

  const navbarAuth = useMemo(
    () => ({
      logout: handleLogout,
      user: user ? (user.name ? user.name : user.email ? user.email : user.sub) : null,
    }),
    [user, handleLogout]
  )

  const mutationFn = useMemo(
    () => createPinMutationHandlers({ isBusy, pinMutation, unPinMutation }),
    [isBusy, pinMutation, unPinMutation]
  )

  const sidebarHotkeys = useMemo(
    () => ({
      close: config?.hotkeys?.["close:sidebar"],
      open: config?.hotkeys?.["open:sidebar"],
      toggle: config?.hotkeys?.["toggle:sidebar"],
    }),
    [config?.hotkeys]
  )

  const currentThemeValues = useMemo(
    () => ({ animations: EMPTY_ANIMATIONS, vars: theme?.vars ?? EMPTY_ANIMATIONS }),
    [theme?.vars]
  )

  return (
    <div className="bg-main-bg min-h-screen w-screen">
      <Toaster
        expand
        position="bottom-right"
      />
      {!isLoginPage && (
        <>
          <div className="mt-4 mx-4">
            <Navbar
              auth={navbarAuth}
              currentThemeId={currentThemeId}
              deleteTheme={deleteTheme}
              heading={heading}
              isBusy={isBusy}
              logEntries={logMessagesArr}
              mutationFn={mutationFn}
              navLinks={config?.navLinks ?? EMPTY_ARRAY}
              onColorChange={onColorChange}
              onSelectTheme={onSelectTheme}
              openQuickLinksModalHotkey={config?.hotkeys?.["open:quicklinks"]}
              pluginLinks={frontendPluginRoutes ?? EMPTY_ARRAY}
              ramRefreshKey={ramUsage ? ramUsage.stamp : 0}
              ramUsage={
                config.additionalSettings?.showBackendRamUsageInNavbar ? ramUsage?.data : undefined
              }
              setIsThemeSidebarOpen={setIsThemeSidebarOpen}
              sidebarHotkeys={sidebarHotkeys}
              themes={themes}
              toastSuccess={toastSuccess}
            />
          </div>

          <ThemeSidebar
            allColors={currentThemeColors ?? EMPTY_ARRAY}
            currentTheme={currentThemeName || "Undefined"}
            currentThemeValues={currentThemeValues}
            isOpen={isThemeSidebarOpen}
            onClose={handleCloseSidebar}
            onColorChange={onColorChange}
            saveNewTheme={createNewThemeFromTheme}
          />
        </>
      )}

      {isLoginPage ? <div>{children}</div> : <div className="mx-4">{children}</div>}
    </div>
  )
}
