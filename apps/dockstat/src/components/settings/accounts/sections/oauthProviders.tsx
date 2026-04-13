import type { Column } from "@dockstat/ui"
import { Badge, Button, Card, CardBody, Divider, Input, Modal, Table } from "@dockstat/ui"
import { AlertCircle, ExternalLink, Plus, Settings, Trash2 } from "lucide-react"
import { useState } from "react"
import type { OAuthProvider } from "./useAccounts"

interface OAuthProvidersSectionProps {
  oauthProviders: OAuthProvider[]
  addOAuthProvider: (data: {
    providerId: string
    type: "oauth" | "oidc"
    clientId: string
    clientSecret: string
    scopes: string[]
    issuer?: string
  }) => void
  removeOAuthProvider: (providerId: string) => void
}

const OAUTH_SCOPES = {
  discord: ["identify", "email"],
  github: ["read:user", "user:email"],
  google: ["openid", "email", "profile"],
  microsoft: ["openid", "email", "profile"],
} as const

const PROVIDER_CONFIGS = [
  { icon: "🔵", id: "google", name: "Google", type: "oauth" as const },
  { icon: "🐙", id: "github", name: "GitHub", type: "oauth" as const },
  { icon: "💬", id: "discord", name: "Discord", type: "oauth" as const },
  { icon: "🪟", id: "microsoft", name: "Microsoft", type: "oauth" as const },
  { icon: "🔑", id: "custom-oidc", name: "Custom OpenID Connect", type: "oidc" as const },
]

export function OAuthProvidersSection({
  oauthProviders,
  addOAuthProvider,
  removeOAuthProvider,
}: OAuthProvidersSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<
    (typeof PROVIDER_CONFIGS)[number] | null
  >(null)
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [issuer, setIssuer] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])

  const handleAddProvider = () => {
    if (!selectedProvider || !clientId || !clientSecret) return

    const scopes =
      selectedProvider.type === "oidc"
        ? selectedScopes.length > 0
          ? selectedScopes
          : ["openid", "profile", "email"]
        : Array.from(OAUTH_SCOPES[selectedProvider.id as keyof typeof OAUTH_SCOPES])

    addOAuthProvider({
      clientId,
      clientSecret,
      issuer: selectedProvider.type === "oidc" ? issuer : undefined,
      providerId: selectedProvider.id,
      scopes,
      type: selectedProvider.type,
    })

    // Reset form
    setShowAddModal(false)
    setSelectedProvider(null)
    setClientId("")
    setClientSecret("")
    setIssuer("")
    setSelectedScopes([])
  }

  const handleSelectProvider = (providerId: string) => {
    const provider = PROVIDER_CONFIGS.find((p) => p.id === providerId)
    if (provider) {
      setSelectedProvider(provider)
      if (provider.type === "oauth") {
        const scopes = OAUTH_SCOPES[provider.id as keyof typeof OAUTH_SCOPES]
        setSelectedScopes(Array.from(scopes))
      }
    }
  }

  const availableScopes = [
    { label: "OpenID", value: "openid" },
    { label: "Profile", value: "profile" },
    { label: "Email", value: "email" },
    { label: "Address", value: "address" },
    { label: "Phone", value: "phone" },
    { label: "Offline Access", value: "offline_access" },
  ]

  const columns: Column<OAuthProvider>[] = [
    {
      key: "providerId",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-xl">
            {PROVIDER_CONFIGS.find((p) => p.id === record.providerId)?.icon || "🔑"}
          </div>
          <div>
            <div className="font-medium text-primary-text">
              {PROVIDER_CONFIGS.find((p) => p.id === record.providerId)?.name || record.providerId}
            </div>
            <Badge
              size="sm"
              variant="secondary"
            >
              {record.type.toUpperCase()}
            </Badge>
          </div>
        </div>
      ),
      title: "Provider",
      width: "30%",
    },
    {
      key: "clientId",
      render: (value) => (
        <code className="font-mono text-sm bg-muted/10 px-2 py-1 rounded">
          {String(value).slice(0, 16)}...
        </code>
      ),
      title: "Client ID",
      width: "30%",
    },
    {
      key: "name",
      render: (_, record) =>
        record.issuer ? (
          <a
            className="text-accent hover:underline flex items-center gap-1"
            href={record.issuer}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="truncate max-w-[200px]">{record.issuer}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-muted-text">-</span>
        ),
      title: "Issuer",
      width: "25%",
    },
    {
      align: "center",
      key: "enabled",
      render: (value) => (
        <Badge
          size="sm"
          variant={value ? "success" : "secondary"}
        >
          {value ? "Enabled" : "Disabled"}
        </Badge>
      ),
      title: "Status",
      width: "10%",
    },
    {
      align: "center",
      key: "type",
      render: (_, record) => (
        <div className="flex items-center gap-2 justify-center">
          <Button
            className="h-7 px-2 text-accent"
            noFocusRing
            size="xs"
            variant="ghost"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
          <Button
            className="h-7 px-2 text-destructive hover:text-destructive"
            noFocusRing
            onClick={() => {
              if (confirm(`Are you sure you want to remove ${record.providerId} provider?`)) {
                removeOAuthProvider(record.providerId)
              }
            }}
            size="xs"
            variant="ghost"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
      title: "Actions",
      width: "5%",
    },
  ]

  return (
    <>
      <Card
        className="space-y-4"
        variant="elevated"
      >
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings
                className="text-accent"
                size={24}
              />
              <h2 className="text-2xl font-semibold text-primary-text">OAuth Providers</h2>
              <Badge
                size="sm"
                variant="secondary"
              >
                {oauthProviders.length}
              </Badge>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              size="md"
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </div>

          <Divider variant="dotted" />

          {oauthProviders.length === 0 ? (
            <Card
              className="p-8 text-center bg-muted/5"
              variant="elevated"
            >
              <Settings className="w-12 h-12 mx-auto text-muted-text/40 mb-3" />
              <h3 className="text-lg font-semibold text-primary-text mb-2">
                No OAuth Providers Configured
              </h3>
              <p className="text-sm text-muted-text mb-4">
                Add OAuth providers to allow users to sign in with their existing accounts.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Provider
              </Button>
            </Card>
          ) : (
            <div className="mt-4">
              <div className="mb-3">
                <p className="text-sm text-muted-text">
                  Configure OAuth providers to enable social login. Users can sign in with their
                  existing accounts from Google, GitHub, Discord, Microsoft, or any OpenID Connect
                  provider.
                </p>
              </div>
              <Table
                bordered
                columns={columns}
                data={oauthProviders}
                hoverable
                rowKey="providerId"
                searchable
                searchPlaceholder="Search providers..."
                size="md"
                striped
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add OAuth Provider Modal */}
      <Modal
        footer={
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              disabled={!selectedProvider || !clientId || !clientSecret}
              onClick={handleAddProvider}
              size="md"
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                setSelectedProvider(null)
                setClientId("")
                setClientSecret("")
                setIssuer("")
                setSelectedScopes([])
              }}
              size="md"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        }
        onClose={() => {
          setShowAddModal(false)
          setSelectedProvider(null)
          setClientId("")
          setClientSecret("")
          setIssuer("")
          setSelectedScopes([])
        }}
        open={showAddModal}
        size="md"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Plus className="w-6 h-6 text-accent" />
            </div>
            <span className="text-xl font-semibold text-primary-text">Add OAuth Provider</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Provider</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent"
              onChange={(e) => handleSelectProvider(e.target.value)}
              value={selectedProvider?.id || ""}
            >
              <option value="">Select a provider</option>
              {PROVIDER_CONFIGS.map((provider) => (
                <option
                  key={provider.id}
                  value={provider.id}
                >
                  {provider.icon} {provider.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <>
              {selectedProvider.type === "oidc" && (
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">
                    Issuer URL
                  </label>
                  <Input
                    onChange={setIssuer}
                    placeholder="https://your-oidc-provider.com/.well-known/openid-configuration"
                    value={issuer}
                  />
                  <p className="text-xs text-muted-text mt-1">
                    The OpenID Connect configuration endpoint URL
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">
                  Client ID
                </label>
                <Input
                  onChange={setClientId}
                  placeholder="Your OAuth application client ID"
                  value={clientId}
                />
                <p className="text-xs text-muted-text mt-1">
                  Get this from your OAuth provider's developer console
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">
                  Client Secret
                </label>
                <Input
                  onChange={setClientSecret}
                  placeholder="Your OAuth application client secret"
                  type="password"
                  value={clientSecret}
                />
                <p className="text-xs text-muted-text mt-1">
                  Keep this secret! It will never be shown again.
                </p>
              </div>

              {selectedProvider.type === "oidc" && (
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">Scopes</label>
                  <div className="space-y-2">
                    {availableScopes.map((scope) => (
                      <div
                        className="flex items-center gap-2"
                        key={scope.value}
                      >
                        <input
                          checked={selectedScopes.includes(scope.value)}
                          className="rounded border-border"
                          id={`scope-${scope.value}`}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScopes([...selectedScopes, scope.value])
                            } else {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope.value))
                            }
                          }}
                          type="checkbox"
                        />
                        <label
                          className="text-sm text-primary-text"
                          htmlFor={`scope-${scope.value}`}
                        >
                          {scope.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Card
                className="bg-accent/5"
                variant="elevated"
              >
                <div className="flex items-start gap-3 p-3">
                  <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                  <div className="text-sm text-muted-text">
                    <p className="font-medium text-primary-text mb-1">Setup Instructions</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Create an OAuth application in your provider's developer console</li>
                      <li>
                        Set the redirect URI to:{" "}
                        <code className="bg-muted/10 px-1 rounded">
                          http://localhost:3030/auth/callback/{selectedProvider.id}
                        </code>
                      </li>
                      <li>Copy the Client ID and Client Secret here</li>
                      <li>Click "Add Provider" to enable OAuth login</li>
                    </ol>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
