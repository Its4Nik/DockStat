import { useAuth } from "@dockstat/auth/client"
import { Button, Card, Divider } from "@dockstat/ui"
import { useCallback, useEffect, useState } from "react"
import { useLocalAuthCheck } from "@/hooks/useLocalAuthCheck"
import { useProviders } from "@/hooks/useProviders"
import { floatingIcons } from "./constants"
import { Footer } from "./Footer"
import { FooterPill } from "./FooterPill"
import { PageHeader } from "./Header"
import { HeroPanel } from "./HeroPanel"
import { LocalLoginForm } from "./LocalLoginForm"
import { LocalRegistration } from "./LocalRegistration"
import { ProviderList } from "./ProviderList"
import { ProvidersLoading } from "./ProviderLoading"
import { AnimatedIconBackground } from "./SignInBg"

export function SignInPage() {
  const [error, setError] = useState<string | null>(null)
  const { login, isAuthenticated } = useAuth()
  const {
    providers,
    loading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
  } = useProviders()
  const {
    exists: localUsersExist,
    checking: localChecking,
    allowRegistration,
  } = useLocalAuthCheck()

  useEffect(() => {
    // Clear error when there's no providersError
    if (!providersError) {
      setError(null)
      return
    }

    // Set the error when providersError exists
    setError(providersError)
  }, [providersError])

  // Separate effect for the timeout to ensure proper cleanup
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null)
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [error])

  const showDivider =
    !localChecking &&
    localUsersExist &&
    !providersLoading &&
    !providersError &&
    providers.length > 0

  const showNoProvidersMessage =
    !localChecking &&
    !providersLoading &&
    !providersError &&
    providers.length === 0 &&
    (localUsersExist || allowRegistration)

  const isReady = !providersLoading && !providersError && !localChecking

  const handleProviderSelect = useCallback((providerId: string) => login(providerId), [login])

  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  useEffect(() => {
    if (!localUsersExist) {
      setActiveTab("register")
    } else {
      setActiveTab("login")
    }
  }, [localUsersExist])

  const showRegisterTab = allowRegistration

  return (
    <AnimatedIconBackground
      icons={floatingIcons}
      isError={error !== null}
    >
      <div className="min-h-screen relative flex overflow-hidden">
        <HeroPanel
          error={error}
          refetchProviders={refetchProviders}
        />

        <FooterPill errored={error !== null} />

        <div className="relative w-full lg:w-[48%] min-h-screen flex items-center justify-center p-5 sm:p-8 overflow-auto">
          <div className="w-full max-w-115 relative z-10 py-8 lg:py-0">
            <Card
              className="rounded-3xl p-7 sm:p-9 slide-r"
              glass
              variant={error !== null ? "error" : "default"}
            >
              <PageHeader />

              {providersLoading && <ProvidersLoading />}

              {providers.length >= 1 && !error && (
                <ProviderList
                  onSelect={handleProviderSelect}
                  providers={providers}
                />
              )}

              {showDivider && (
                <Divider
                  className="my-6"
                  label="or"
                />
              )}

              {showNoProvidersMessage && (
                <Divider
                  className="my-6"
                  label={
                    <p className="text-center">
                      No SSO Providers found. Use local auth below
                      <br />
                      Configure SSO in the Settings
                    </p>
                  }
                />
              )}

              <div className="flex gap-2 my-4">
                {localUsersExist && (
                  <Button
                    className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      activeTab === "login"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-white/5 text-white/40 hover:bg-white/10 border border-transparent"
                    }`}
                    noFocusRing
                    onClick={() => setActiveTab("login")}
                    variant="ghost"
                  >
                    Login
                  </Button>
                )}
                {showRegisterTab && localUsersExist && (
                  <Button
                    className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      activeTab === "register"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-white/5 text-white/40 hover:bg-white/10 border border-transparent"
                    }`}
                    noFocusRing
                    onClick={() => setActiveTab("register")}
                    variant="ghost"
                  >
                    Register
                  </Button>
                )}
              </div>

              <div className="min-h-70">
                {activeTab === "login" && !localChecking && localUsersExist && (
                  <LocalLoginForm
                    error={error}
                    setError={setError}
                  />
                )}
                {activeTab === "register" && showRegisterTab && (
                  <LocalRegistration
                    allowGuest={allowRegistration}
                    isAuthenticated={isAuthenticated}
                    setError={setError}
                  />
                )}
              </div>

              {isReady && <Footer />}
            </Card>
          </div>
        </div>
      </div>
    </AnimatedIconBackground>
  )
}
