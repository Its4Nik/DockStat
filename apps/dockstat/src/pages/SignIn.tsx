import { useAuth } from "@dockstat/auth/client"
import { Divider } from "@dockstat/ui"
import {
  SiAuthelia,
  SiAuthentik,
  SiGithub,
  SiGoogle,
  SiKeycloak,
  SiOkta,
} from "@icons-pack/react-simple-icons"
import { useCallback } from "react"
import { Footer } from "@/components/auth/Footer"
import { PageHeader } from "@/components/auth/Header"
import { HeroPanel } from "@/components/auth/HeroPanel"
import { LocalLoginForm } from "@/components/auth/LocalLoginForm"
import { ProvidersError } from "@/components/auth/ProviderError"
import { ProviderList } from "@/components/auth/ProviderList"
import { ProvidersLoading } from "@/components/auth/ProviderLoading"
import { AnimatedIconBackground } from "@/components/auth/SignInBg"
import { useLocalAuthCheck } from "@/hooks/useLocalAuthCheck"
import { useProviders } from "@/hooks/useProviders"

const floatingIcons = [
  <SiAuthelia
    className="w-full h-full"
    key="sparkles"
  />,
  <SiKeycloak
    className="w-full h-full"
    key="zap"
  />,
  <SiAuthentik
    className="w-full h-full"
    key="shield"
  />,
  <SiOkta
    className="w-full h-full"
    key="globe"
  />,
  <SiGoogle
    className="w-full h-full"
    key="code"
  />,
  <SiGithub
    className="w-full h-full"
    key="database"
  />,
]

function SignInPage() {
  const { login } = useAuth()
  const {
    providers,
    loading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
  } = useProviders()
  const { exists: localUsersExist, checking: localChecking } = useLocalAuthCheck()

  const showDivider =
    !localChecking &&
    localUsersExist &&
    !providersLoading &&
    !providersError &&
    providers.length > 0

  const isReady = !providersLoading && !providersError && !localChecking

  const handleProviderSelect = useCallback((providerId: string) => login(providerId), [login])

  return (
    <AnimatedIconBackground
      icons={floatingIcons}
      isError={providersError !== null}
      isLoading={providersLoading}
    >
      <div className="min-h-screen relative flex overflow-hidden">
        <HeroPanel />

        <div className="relative w-full lg:w-[48%] min-h-screen flex items-center justify-center p-5 sm:p-8 overflow-auto">
          <div className="w-full max-w-[460px] relative z-10 py-8 lg:py-0">
            <div className="glass-panel rounded-3xl p-7 sm:p-9 slide-r">
              <PageHeader />

              {providersLoading && <ProvidersLoading />}

              {providersError && <ProvidersError onRetry={refetchProviders} />}

              {!providersLoading && !providersError && (
                <ProviderList
                  onSelect={handleProviderSelect}
                  providers={providers}
                />
              )}

              {showDivider && (
                <Divider
                  className="my-4"
                  label="or"
                />
              )}

              {!localChecking && localUsersExist && <LocalLoginForm />}

              {isReady && <Footer showLocalHint={!localUsersExist} />}
            </div>
          </div>
        </div>
      </div>
    </AnimatedIconBackground>
  )
}

export default SignInPage
