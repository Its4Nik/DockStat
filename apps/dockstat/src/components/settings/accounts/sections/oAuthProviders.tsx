import { Button, Card, CardBody, Input } from "@dockstat/ui"
import {
  type IconType,
  SiAuth0,
  SiAuthentik,
  SiBitbucket,
  SiGithub,
  SiGitlab,
  SiGoogle,
  SiKeycloak,
  SiOkta,
} from "@icons-pack/react-simple-icons"
import {
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Lock,
  LockKeyhole,
  type LucideProps,
  Plus,
  Trash2,
} from "lucide-react"
import { type ForwardRefExoticComponent, useState } from "react"
import { getProviderLogo } from "@/components/auth/getProviderLogo"
import { useAccountsMutations } from "@/hooks/mutations/accounts"
import { useAccountsQueries } from "@/hooks/queries/accounts"

// Common OAuth providers with their icons
const COMMON_PROVIDERS = [
  { component: SiGoogle, icon: "SiGoogle", name: "Google" },
  { component: SiGithub, icon: "SiGithub", name: "GitHub" },
  { component: SiGitlab, icon: "SiGitlab", name: "GitLab" },
  { component: SiAuth0, icon: "SiAuth0", name: "Auth0" },
  { component: SiKeycloak, icon: "SiKeycloak", name: "Keycloak" },
  { component: SiOkta, icon: "SiOkta", name: "Okta" },
  { component: SiAuthentik, icon: "SiAuthentik", name: "Authentik" },
  { component: SiBitbucket, icon: "SiBitbucket", name: "Bitbucket" },
  { component: Globe, icon: "SiGlobe", name: "Custom" },
]

// Map icon strings to React components
const ICON_MAP: Record<string, IconType | ForwardRefExoticComponent<Omit<LucideProps, "ref">>> = {
  SiAuth0: SiAuth0,
  SiAuthentik: SiAuthentik,
  SiBitbucket: SiBitbucket,
  SiGithub: SiGithub,
  SiGitlab: SiGitlab,
  SiGoogle: SiGoogle,
  SiKeycloak: SiKeycloak,
  SiOkta: SiOkta,
}

export const mapIconNameToIcon = (
  name: string
): ForwardRefExoticComponent<Omit<LucideProps, "ref">> => {
  return ICON_MAP[name] || LockKeyhole
}

export function OAuthProvidersSection() {
  const { providers, providersLoading, refetchProviders } = useAccountsQueries()
  const { createProviderMutation, deleteProviderMutation } = useAccountsMutations()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProviderType, setSelectedProviderType] = useState(COMMON_PROVIDERS[0])
  const [providerName, setProviderName] = useState("")
  const [issuerUrl, setIssuerUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [scopes, setScopes] = useState("openid profile email")
  const [logoutUrl, setLogoutUrl] = useState("")
  const [showSecret, setShowSecret] = useState(false)

  const handleCreateProvider = async () => {
    if (!providerName.trim() || !issuerUrl.trim() || !clientId.trim() || !clientSecret.trim()) {
      alert("Please fill in all required fields")
      return
    }

    try {
      await createProviderMutation.mutateAsync({
        client_id: clientId,
        client_secret: clientSecret,
        icon: selectedProviderType.icon,
        issuer_url: issuerUrl,
        logout_url: logoutUrl || null,
        name: providerName,
        scopes: scopes || null,
      })

      // Reset form
      setProviderName("")
      setIssuerUrl("")
      setClientId("")
      setClientSecret("")
      setScopes("openid profile email")
      setLogoutUrl("")
      setSelectedProviderType(COMMON_PROVIDERS[0])
      setShowCreateDialog(false)
      refetchProviders()
    } catch (error) {
      console.error("Failed to create OAuth provider:", error)
    }
  }

  const handleDeleteProvider = async (providerId: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete OAuth provider "${name}"? This action cannot be undone.`
      )
    ) {
      await deleteProviderMutation.mutateAsync({ body: undefined, params: { providerId } })
      refetchProviders()
    }
  }

  const handleProviderTypeChange = (providerName: string) => {
    const provider = COMMON_PROVIDERS.find((p) => p.name === providerName)
    if (provider) {
      setSelectedProviderType(provider)
      // Auto-fill name if empty
      if (!providerName || providerName === "Custom") {
        setProviderName(provider.name)
      }
    }
  }

  if (providersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2
          className="animate-spin text-muted-text"
          size={24}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white/90">OAuth Providers</h3>
          <p className="text-sm text-white/40">Configure external authentication providers</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowCreateDialog(!showCreateDialog)}
          size="sm"
          variant="outline"
        >
          <Plus size={16} />
          Add Provider
        </Button>
      </div>

      {showCreateDialog && (
        <Card variant="outlined">
          <CardBody className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="provider-type"
              >
                Provider Type
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                id="provider-type"
                onChange={(e) => handleProviderTypeChange(e.target.value)}
                value={selectedProviderType.name}
              >
                {COMMON_PROVIDERS.map((provider) => (
                  <option
                    key={provider.name}
                    value={provider.name}
                  >
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="provider-name"
              >
                Provider Name
              </label>
              <Input
                className="bg-white/5!"
                id="provider-name"
                onChange={(v) => setProviderName(v)}
                placeholder="e.g., Company SSO"
                value={providerName}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="issuer-url"
              >
                Issuer URL
              </label>
              <div className="relative">
                <Globe
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  size={16}
                />
                <Input
                  className="bg-white/5! pl-10"
                  id="issuer-url"
                  onChange={(v) => setIssuerUrl(v)}
                  placeholder="https://accounts.google.com"
                  type="url"
                  value={issuerUrl}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">
                The OpenID Connect issuer URL (e.g., https://accounts.google.com)
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="client-id"
              >
                Client ID
              </label>
              <div className="relative">
                <Key
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  size={16}
                />
                <Input
                  className="bg-white/5! pl-10"
                  id="client-id"
                  onChange={(v) => setClientId(v)}
                  placeholder="Your OAuth client ID"
                  value={clientId}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="client-secret"
              >
                Client Secret
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  size={16}
                />
                <Input
                  className="bg-white/5! pl-10 pr-10"
                  id="client-secret"
                  onChange={(v) => setClientSecret(v)}
                  placeholder="Your OAuth client secret"
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
                  onClick={() => setShowSecret(!showSecret)}
                  type="button"
                >
                  {showSecret ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="scopes"
              >
                Scopes
              </label>
              <Input
                className="bg-white/5!"
                id="scopes"
                onChange={(v) => setScopes(v)}
                placeholder="openid profile email"
                value={scopes}
              />
              <p className="text-xs text-white/30 mt-1">
                Space-separated list of OAuth scopes (default: openid profile email)
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="logout-url"
              >
                Logout URL (Optional)
              </label>
              <div className="relative">
                <ExternalLink
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  size={16}
                />
                <Input
                  className="bg-white/5! pl-10"
                  id="logout-url"
                  onChange={(v) => setLogoutUrl(v)}
                  placeholder="https://your-provider.com/logout"
                  type="url"
                  value={logoutUrl}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">
                Custom logout URL (will use OIDC end session URL if not provided)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={createProviderMutation.isPending}
                onClick={handleCreateProvider}
              >
                {createProviderMutation.isPending ? (
                  <>
                    <Loader2
                      className="animate-spin mr-2"
                      size={16}
                    />
                    Creating...
                  </>
                ) : (
                  "Create Provider"
                )}
              </Button>
              <Button
                disabled={createProviderMutation.isPending}
                onClick={() => setShowCreateDialog(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {providers.length === 0 && !showCreateDialog ? (
        <Card variant="outlined">
          <CardBody className="py-8 text-center">
            <Globe
              className="mx-auto mb-3 text-muted-text"
              size={32}
            />
            <p className="text-sm text-white/40">No OAuth providers configured</p>
            <p className="text-xs text-white/20 mt-1">
              Add an OAuth provider to enable external authentication
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => {
            // Try to use database icon/name first, otherwise fall back to getProviderLogo
            const fallback = getProviderLogo(provider.issuer_url, provider.icon ?? "")
            const displayName = provider.name || fallback.name

            // Check if we have a custom icon component from the database
            const CustomIconComponent = provider.icon ? ICON_MAP[provider.icon] : null

            return (
              <Card
                key={provider.id}
                variant="outlined"
              >
                <CardBody className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      {CustomIconComponent !== null && (
                        <div className="text-accent">
                          <CustomIconComponent size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white/90">{displayName}</p>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                        <span className="truncate">{provider.issuer_url}</span>
                        <span>•</span>
                        <span>Client ID: {provider.client_id}</span>
                        {provider.scopes && (
                          <>
                            <span>•</span>
                            <span>Scopes: {provider.scopes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDeleteProvider(provider.id, displayName)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
