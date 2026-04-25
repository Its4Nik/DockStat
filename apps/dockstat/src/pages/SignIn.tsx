import { useAuth } from "@dockstat/auth/client"
import { Button, Card, Divider, Input } from "@dockstat/ui"
import {
  SiAuth0,
  SiAuthelia,
  SiAuthentik,
  SiBitbucket,
  SiDiscord,
  SiFacebook,
  SiFusionauth,
  SiGithub,
  SiGitlab,
  SiGoogle,
  SiKeycloak,
  SiOkta,
  SiSpotify,
  SiTwitch,
  SiYandexcloud,
} from "@icons-pack/react-simple-icons"
import { ArrowRight, DoorOpen, Eye, EyeOff, Loader2, Shield } from "lucide-react"
import { useCallback, useState } from "react"

import { Footer } from "@/components/auth/Footer"
import { PageHeader } from "@/components/auth/Header"
import { HeroPanel } from "@/components/auth/HeroPanel"

import { ProvidersError } from "@/components/auth/ProviderError"
import { ProviderList } from "@/components/auth/ProviderList"
import { ProvidersLoading } from "@/components/auth/ProviderLoading"
import { AnimatedIconBackground } from "@/components/auth/SignInBg"
import { useCreateUserMutations } from "@/hooks/mutations/registerUser"
import { useLocalAuthCheck } from "@/hooks/useLocalAuthCheck"
import { useLocalLogin } from "@/hooks/useLocalLogin"
import { useProviders } from "@/hooks/useProviders"

export const floatingIcons = [
  <SiAuthelia
    className="w-full h-full"
    key="authelia"
  />,
  <SiKeycloak
    className="w-full h-full"
    key="keycloak"
  />,
  <SiAuthentik
    className="w-full h-full"
    key="authentik"
  />,
  <SiOkta
    className="w-full h-full"
    key="okta"
  />,
  <SiGoogle
    className="w-full h-full"
    key="google"
  />,
  <SiGithub
    className="w-full h-full"
    key="github"
  />,
  <SiBitbucket
    className="w-full h-full"
    key="bitbucket"
  />,
  <SiDiscord
    className="w-full h-full"
    key="discord"
  />,
  <SiFacebook
    className="w-full h-full"
    key="facebook"
  />,
  <SiGitlab
    className="w-full h-full"
    key="gitlab"
  />,
  <SiSpotify
    className="w-full h-full"
    key="spotify"
  />,
  <SiTwitch
    className="w-full h-full"
    key="twitch"
  />,
  <SiAuth0
    className="w-full h-full"
    key="auth0"
  />,
  <SiFusionauth
    className="w-full h-full"
    key="fusionauth"
  />,
  <SiYandexcloud
    className="w-full h-full"
    key="yandexcloud"
  />,
]

function SignInPage() {
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

  const showDivider =
    !localChecking &&
    localUsersExist &&
    !providersLoading &&
    !providersError &&
    providers.length > 0

  // Show divider when no providers but local auth is available
  const showNoProvidersMessage =
    !localChecking &&
    !providersLoading &&
    !providersError &&
    providers.length === 0 &&
    (localUsersExist || allowRegistration)

  const isReady = !providersLoading && !providersError && !localChecking

  const handleProviderSelect = useCallback((providerId: string) => login(providerId), [login])

  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  // Only show registration tab if registration is allowed
  const showRegisterTab = allowRegistration

  return (
    <AnimatedIconBackground
      icons={floatingIcons}
      isError={providersError !== null}
    >
      <div className="min-h-screen relative flex overflow-hidden">
        <HeroPanel />

        <div className="relative w-full lg:w-[48%] min-h-screen flex items-center justify-center p-5 sm:p-8 overflow-auto">
          <div className="w-full max-w-115 relative z-10 py-8 lg:py-0">
            <Card
              className={"rounded-3xl p-7 sm:p-9 slide-r"}
              glass
              variant={providersError !== null ? "error" : "default"}
            >
              <PageHeader />

              {providersLoading && <ProvidersLoading />}

              {providersError && <ProvidersError onRetry={refetchProviders} />}

              {providers.length >= 1 && !providersError && (
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

              {/* Tab Navigation */}
              <div className="flex gap-2 my-4">
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
                {showRegisterTab && (
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

              {/* Form Content */}
              <div className="min-h-70">
                {activeTab === "login" && !localChecking && localUsersExist && <LoginFormContent />}
                {activeTab === "register" && showRegisterTab && (
                  <RegisterContent
                    allowGuest={allowRegistration}
                    isAuthenticated={isAuthenticated}
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

// Extracted Login Form Component for better performance
function LoginFormContent() {
  const { formData, error, isSubmitting, showPassword, handleSubmit, updateField, togglePassword } =
    useLocalLogin()

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
          <Shield
            className="text-indigo-400"
            size={16}
          />
        </div>
        <div>
          <h3 className="font-semibold text-white/80">Local Account</h3>
          <p className="text-xs text-white/30">Use your username and password</p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30">
            Username
          </p>
          <div className="field-shell px-4 py-3">
            <Input
              className="bg-transparent! border-0! shadow-none! p-0! ring-0! w-full text-sm text-white/80 placeholder:text-white/25"
              disabled={isSubmitting}
              onChange={(v) => updateField("name", v)}
              placeholder="Enter your username"
              value={formData.name}
            />
          </div>
        </div>

        <div>
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30">
            Password
          </p>
          <div className="field-shell px-4 py-3 flex items-center">
            <Input
              className="bg-transparent! border-0! shadow-none! p-0! ring-0! w-full text-sm text-white/80 placeholder:text-white/25"
              disabled={isSubmitting}
              onChange={(v) => updateField("pass", v)}
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={formData.pass}
            />
            <button
              className="shrink-0 ml-2 p-1 rounded-md text-white/20 hover:text-white/40 transition-colors"
              onClick={togglePassword}
              tabIndex={-1}
              type="button"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        )}

        <button
          className="cta-button w-full py-3.5 text-white font-semibold text-sm flex items-center justify-center gap-2"
          disabled={isSubmitting || !formData.name || !formData.pass}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="animate-spin"
                size={16}
              />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  )
}

// Extracted Register Form Component for better performance
function RegisterContent({
  allowGuest,
  isAuthenticated,
}: {
  allowGuest: boolean
  isAuthenticated: boolean
}) {
  if (allowGuest === false && isAuthenticated !== true) {
    return null
  }

  const [name, setName] = useState<string>("")
  const [pass, setPass] = useState<string>("")
  const [showPass, setShowPass] = useState(false)
  const [err, setErr] = useState<null | string>(null)

  const { registerLocalUser } = useCreateUserMutations()

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setErr(null)

    registerLocalUser.mutate({
      name,
      pass,
    })

    if (registerLocalUser.error !== null) {
      setErr(registerLocalUser.error.toString())
    }
  }

  const togglePassword = () => setShowPass(!showPass)

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
          <DoorOpen
            className="text-indigo-400"
            size={16}
          />
        </div>
        <div>
          <h3 className="font-semibold text-white/80">Register local Account</h3>
          <p className="text-xs text-white/30">Provide your username and password</p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30">
            Username
          </p>
          <div className="field-shell px-4 py-3">
            <Input
              className="bg-transparent! border-0! shadow-none! p-0! ring-0! w-full text-sm text-white/80 placeholder:text-white/25"
              disabled={registerLocalUser.isPending}
              onChange={(v) => setName(v)}
              placeholder="Enter your username"
              value={name}
            />
          </div>
        </div>

        <div>
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30">
            Password
          </p>
          <div className="field-shell px-4 py-3 flex items-center">
            <Input
              className="bg-transparent! border-0! shadow-none! p-0! ring-0! w-full text-sm text-white/80 placeholder:text-white/25"
              disabled={registerLocalUser.isPending}
              onChange={(v) => setPass(v)}
              placeholder="Enter your password"
              type={showPass ? "text" : "password"}
              value={pass}
            />
            <button
              className="shrink-0 ml-2 p-1 rounded-md text-white/20 hover:text-white/40 transition-colors"
              onClick={togglePassword}
              tabIndex={-1}
              type="button"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {err && (
          <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <p className="text-sm text-red-300/80">{err}</p>
          </div>
        )}

        <button
          className="cta-button w-full py-3.5 text-white font-semibold text-sm flex items-center justify-center gap-2"
          disabled={registerLocalUser.isPending || !name || !pass}
          type="submit"
        >
          {registerLocalUser.isPending ? (
            <>
              <Loader2
                className="animate-spin"
                size={16}
              />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  )
}

export default SignInPage
