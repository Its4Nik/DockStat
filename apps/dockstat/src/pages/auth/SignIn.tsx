import { useAuth } from "@dockstat/auth/client"
import { Button, Card, CardBody, CardHeader, Input } from "@dockstat/ui"
import { ArrowRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { getProviderInfo } from "./getProviderInfo"
import DockStatLogo from "@/assets/logo.png"

interface OAuthProvider {
  id: string
  issuer_url: string
  client_id: string
  scopes: string
  created_at: Date
}

export function SignInPage() {
  const { login } = useAuth()

  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchProvider, setSearchProvider] = useState("")

  const [localUsersExist, setLocalUsersExist] = useState(false)
  const [localChecking, setLocalChecking] = useState(true)
  const [localLoginData, setLocalLoginData] = useState({ name: "", pass: "" })
  const [localLoginError, setLocalLoginError] = useState<string | null>(null)
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)

  useEffect(() => {
    fetchProviders()
    checkLocalUsers()
  }, [])

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true)
      const response = await api.auth.providers.get()
      if (response.status === 200 && response.data) {
        setProviders(response.data)
      } else {
        setError("Failed to load authentication providers")
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err)
      setError("Failed to load authentication providers")
    } finally {
      setProvidersLoading(false)
    }
  }

  const handleLogin = (providerId: string) => {
    login(providerId)
  }

  const checkLocalUsers = async () => {
    try {
      setLocalChecking(true)
      const response = await api.auth.local.exists.get()
      if (response.status === 200 && response.data) {
        setLocalUsersExist(response.data.exists)
      }
    } catch (err) {
      console.error("Failed to check local users:", err)
      setLocalUsersExist(false)
    } finally {
      setLocalChecking(false)
    }
  }

  const handleLocalLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLocalLoginError(null)
    setIsSubmittingLocal(true)

    try {
      const response = await api.auth.local.login.post({
        name: localLoginData.name,
        pass: localLoginData.pass,
      })

      if (response.status === 401) {
        setLocalLoginError("Invalid username or password")
        return
      }

      if (response.status !== 200 && response.status !== 302) {
        setLocalLoginError("Login failed. Please try again.")
        return
      }

      const token = response.data?.token
      if (token) {
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join("")
        )

        const { user } = JSON.parse(jsonPayload)
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("auth_token", token)
        localStorage.setItem("auth_provider_id", "local")

        const redirect = localStorage.getItem("auth_redirect") || "/"
        localStorage.removeItem("auth_redirect")
        window.location.href = redirect
      }
    } catch (err) {
      console.error("Local login error:", err)
      setLocalLoginError("Login failed. Please try again.")
    } finally {
      setIsSubmittingLocal(false)
    }
  }

  const filteredProviders = providers.filter((provider) => {
    if (!searchProvider) return true
    const info = getProviderInfo(provider.issuer_url)
    return info.name.toLowerCase().includes(searchProvider.toLowerCase())
  })

  return (
    <>
      <style>{`
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(60px, -80px) scale(1.1); }
          50% { transform: translate(-30px, -40px) scale(0.95); }
          75% { transform: translate(40px, 30px) scale(1.05); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-50px, 60px) scale(1.08); }
          50% { transform: translate(40px, 20px) scale(0.92); }
          75% { transform: translate(-20px, -50px) scale(1.04); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, 50px) scale(1.06); }
          50% { transform: translate(-60px, -20px) scale(0.94); }
          75% { transform: translate(20px, -40px) scale(1.02); }
        }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes logo-breathe {
          0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 50px rgba(99,102,241,0.45), 0 0 100px rgba(99,102,241,0.15); }
        }
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.08); opacity: 0.1; }
        }

        .orb-a { animation: orb-drift-1 25s ease-in-out infinite; }
        .orb-b { animation: orb-drift-2 30s ease-in-out infinite; }
        .orb-c { animation: orb-drift-3 28s ease-in-out infinite; }

        .rise { animation: rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .rise-d1 { animation: rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.07s forwards; opacity: 0; }
        .rise-d2 { animation: rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.14s forwards; opacity: 0; }
        .rise-d3 { animation: rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards; opacity: 0; }
        .rise-d4 { animation: rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.30s forwards; opacity: 0; }
        .rise-d5 { animation: rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.38s forwards; opacity: 0; }

        .shimmer-text {
          background-size: 200% auto;
          animation: gradient-shimmer 5s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .panel {
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.02),
            0 32px 64px -16px rgba(0, 0, 0, 0.55),
            0 0 140px -50px rgba(99, 102, 241, 0.12);
        }

        .field-shell {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .field-shell:focus-within {
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(255, 255, 255, 0.055);
          box-shadow: 0 0 24px -4px rgba(99, 102, 241, 0.12);
        }

        .provider-tile {
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 16px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .provider-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.03));
          opacity: 0;
          transition: opacity 0.35s ease;
          border-radius: inherit;
        }
        .provider-tile:hover {
          background: rgba(255, 255, 255, 0.055);
          border-color: rgba(99, 102, 241, 0.22);
          transform: translateY(-3px);
          box-shadow:
            0 12px 36px -8px rgba(99, 102, 241, 0.18),
            0 0 0 1px rgba(99, 102, 241, 0.08);
        }
        .provider-tile:hover::before { opacity: 1; }
        .provider-tile:hover .provider-arrow {
          color: rgba(99, 102, 241, 0.7);
          transform: translateX(2px);
        }
        .provider-arrow {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .local-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }

        .cta-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%);
          background-size: 200% 200%;
          border-radius: 12px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent 60%);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .cta-btn:hover:not(:disabled)::before { opacity: 1; }
        .cta-btn:hover:not(:disabled) {
          background-position: 100% 100%;
          box-shadow: 0 0 32px -4px rgba(99, 102, 241, 0.5), 0 8px 24px -8px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }
        .cta-btn:active:not(:disabled) { transform: translateY(0); }
        .cta-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .logo-box {
          animation: logo-breathe 4s ease-in-out infinite;
        }
        .logo-ring {
          position: absolute;
          inset: -10px;
          border-radius: 26px;
          border: 1px solid rgba(99, 102, 241, 0.12);
          animation: ring-pulse 3s ease-in-out infinite;
        }

        .state-card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }
        .state-card-err {
          background: rgba(239, 68, 68, 0.04);
          border: 1px solid rgba(239, 68, 68, 0.12);
          border-radius: 16px;
        }

        .err-inline {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.12);
          border-radius: 10px;
        }

        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.07), transparent);
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div
        className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
        style={{ background: "#07070d" }}
      >
        {/* ── Background Layer ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute orb-a"
            style={{
              width: 750,
              height: 750,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 45%, transparent 70%)",
              top: "-22%",
              right: "-18%",
              filter: "blur(48px)",
            }}
          />
          <div
            className="absolute orb-b"
            style={{
              width: 650,
              height: 650,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.03) 45%, transparent 70%)",
              bottom: "-22%",
              left: "-16%",
              filter: "blur(48px)",
            }}
          />
          <div
            className="absolute orb-c"
            style={{
              width: 520,
              height: 520,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 45%, transparent 70%)",
              top: "32%",
              left: "42%",
              filter: "blur(48px)",
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.022,
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(7,7,13,0.85) 100%)",
            }}
          />
        </div>

        {/* ── Content Layer ── */}
        <div className="w-full max-w-xl relative z-10">
          <div className="panel rounded-[28px] p-8 md:p-12">
            {/* Logo */}
            <div className="flex justify-center mb-10 rise">
              <div className="relative">
                <div className="logo-ring" />
                <div
                  className="logo-box w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)",
                  }}
                >
                  {/* ─── REPLACE THIS SVG WITH YOUR LOGO ─── */}
                  <img src={DockStatLogo} alt="DockStat Logo" />
                  {/* ─── END LOGO PLACEHOLDER ─── */}
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-10 rise-d1">
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight shimmer-text mb-3"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #ffffff 0%, #a5b4fc 35%, #c4b5fd 65%, #ffffff 100%)",
                }}
              >
                Welcome Back
              </h1>
              <p
                className="text-[15px]"
                style={{ color: "rgba(255,255,255,0.32)" }}
              >
                Sign in to continue to DockStat
              </p>
            </div>

            {/* Search */}
            <div className="mb-8 rise-d2">
              <div className="field-shell px-4 py-3 flex items-center gap-3">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: "rgba(255,255,255,0.18)",
                    flexShrink: 0,
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  aria-label="Search provider"
                  className="w-full bg-transparent outline-none text-[15px]"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                  onChange={(e) => setSearchProvider(e.target.value)}
                  placeholder="Search provider..."
                  value={searchProvider}
                />
                {searchProvider && (
                  <button
                    type="button"
                    onClick={() => setSearchProvider("")}
                    className="flex-shrink-0 p-0.5 rounded-md transition-colors"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.25)")
                    }
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Loading */}
            {providersLoading && (
              <div className="state-card p-10 rise-d3">
                <div className="text-center flex flex-col items-center gap-4">
                  <Loader2
                    className="animate-spin"
                    size={26}
                    style={{ color: "rgba(99,102,241,0.65)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Loading authentication providers...
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="state-card-err p-10 rise-d3">
                <div className="text-center flex flex-col items-center gap-4">
                  <p
                    className="text-sm"
                    style={{ color: "rgba(248,113,113,0.85)" }}
                  >
                    {error}
                  </p>
                  <button
                    onClick={fetchProviders}
                    className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: "rgba(248,113,113,0.75)",
                      border: "1px solid rgba(239,68,68,0.18)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Local Login */}
            {!localChecking && localUsersExist && (
              <div className="local-section p-6 md:p-8 mb-6 rise-d3">
                <div className="mb-6">
                  <h2
                    className="text-[17px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.88)" }}
                  >
                    Local Account
                  </h2>
                  <p
                    className="text-[13px] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  >
                    Sign in with your local credentials
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleLocalLogin}>
                  <div>
                    <label
                      className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Username
                    </label>
                    <div className="field-shell px-4 py-3">
                      <Input
                        className="!bg-transparent !border-0 !shadow-none !p-0 !ring-0 w-full"
                        disabled={isSubmittingLocal}
                        onChange={(v) =>
                          setLocalLoginData({ ...localLoginData, name: v })
                        }
                        placeholder="Enter your username"
                        value={localLoginData.name}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Password
                    </label>
                    <div className="field-shell px-4 py-3">
                      <Input
                        className="!bg-transparent !border-0 !shadow-none !p-0 !ring-0 w-full"
                        disabled={isSubmittingLocal}
                        onChange={(v) =>
                          setLocalLoginData({ ...localLoginData, pass: v })
                        }
                        placeholder="Enter your password"
                        type="password"
                        value={localLoginData.pass}
                      />
                    </div>
                  </div>

                  {localLoginError && (
                    <div className="err-inline px-4 py-3">
                      <p
                        className="text-sm"
                        style={{ color: "rgba(248,113,113,0.85)" }}
                      >
                        {localLoginError}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSubmittingLocal ||
                      !localLoginData.name ||
                      !localLoginData.pass
                    }
                    className="cta-btn w-full py-3 text-white font-semibold text-[14px] flex items-center justify-center gap-2 relative z-10"
                  >
                    {isSubmittingLocal ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Divider */}
            {!localChecking &&
              localUsersExist &&
              !providersLoading &&
              !error &&
              filteredProviders.length > 0 && (
                <div className="flex items-center gap-4 mb-6 rise-d4">
                  <div className="divider-line flex-1" />
                  <span
                    className="text-[11px] uppercase tracking-[0.15em] font-medium"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                  >
                    or continue with
                  </span>
                  <div className="divider-line flex-1" />
                </div>
              )}

            {/* Empty State */}
            {!providersLoading &&
              !error &&
              filteredProviders.length === 0 && (
                <div className="state-card p-10 rise-d4">
                  <div className="text-center">
                    <p
                      className="text-sm"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      No providers found
                    </p>
                  </div>
                </div>
              )}

            {/* Provider Grid */}
            {!providersLoading &&
              !error &&
              filteredProviders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rise-d4">
                  {filteredProviders.map((provider) => {
                    const info = getProviderInfo(provider.issuer_url)
                    return (
                      <div
                        className="provider-tile p-4"
                        key={provider.id}
                        onClick={() => handleLogin(provider.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            handleLogin(provider.id)
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="relative z-10 flex items-center gap-3.5">
                          <div
                            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))",
                              border: "1px solid rgba(99,102,241,0.12)",
                            }}
                          >
                            {info.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-[14px] truncate"
                              style={{ color: "rgba(255,255,255,0.88)" }}
                            >
                              {info.name}
                            </h3>
                            <p
                              className="text-[12px] truncate mt-0.5"
                              style={{ color: "rgba(255,255,255,0.22)" }}
                            >
                              {new URL(provider.issuer_url).hostname}
                            </p>
                          </div>
                          <ArrowRight
                            size={15}
                            className="provider-arrow flex-shrink-0"
                            style={{ color: "rgba(255,255,255,0.15)" }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            {/* Footer */}
            {!providersLoading && !error && !localChecking && (
              <div className="text-center mt-10 space-y-2 rise-d5">
                <p
                  className="text-[12px]"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                >
                  By signing in, you agree to our Terms of Service and Privacy
                  Policy.
                </p>
                {!localUsersExist && (
                  <p
                    className="text-[12px]"
                    style={{ color: "rgba(255,255,255,0.12)" }}
                  >
                    Don't see your provider? Contact your administrator.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SignInPage
