import { Button, Card, CardBody, Input } from "@dockstat/ui"
import { Copy, Key, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useAccountsMutations } from "@/hooks/mutations/accounts"
import { useApiKeysQuery } from "@/hooks/queries/accounts"
import { toast } from "@/lib/toast"

export function ApiKeysSection() {
  const { apiKeys, isLoading, refetch } = useApiKeysQuery()
  const { createApiKeyMutation, deleteApiKeyMutation } = useAccountsMutations()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyScopes, setNewKeyScopes] = useState("*")
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState("")
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null)

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        description: "Please enter a name for the API key",
        title: "Validation Error",
      })
      return
    }

    try {
      const result = await createApiKeyMutation.mutateAsync({
        expiresAt: newKeyExpiresAt || undefined,
        name: newKeyName,
        scopes: newKeyScopes,
        userId: "", // Will be populated by the backend from the auth token
      })

      if (!result.apiKey) {
        toast({
          description: "Failed to create API key",
          title: "Error",
        })
        return
      }

      setCreatedApiKey(result.apiKey.key)
      setNewKeyName("")
      setNewKeyScopes("*")
      setNewKeyExpiresAt("")
      setShowCreateDialog(false)
      refetch()
    } catch (error) {
      console.error("Failed to create API key:", error)
    }
  }

  const handleDeleteKey = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete API key "${name}"? This action cannot be undone.`
      )
    ) {
      await deleteApiKeyMutation.mutateAsync({ body: undefined, params: { id } })
      refetch()
    }
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      description: "API key copied to clipboard",
      title: "Copied!",
    })
  }

  if (isLoading) {
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
          <h3 className="text-lg font-semibold text-white/90">API Keys</h3>
          <p className="text-sm text-white/40">Manage API keys for programmatic access</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowCreateDialog(!showCreateDialog)}
          size="sm"
          variant="outline"
        >
          <Plus size={16} />
          Create API Key
        </Button>
      </div>

      {createdApiKey && (
        <Card
          className="border-accent/50 bg-accent/5"
          variant="outlined"
        >
          <CardBody className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-accent">API Key Created!</p>
                <p className="text-sm text-white/60">
                  Copy this key now. You won't be able to see it again.
                </p>
              </div>
              <Button
                className="h-8 px-3 text-xs"
                onClick={() => setCreatedApiKey(null)}
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                className="flex-1 font-mono text-sm bg-white/5"
                disabled
                value={createdApiKey}
              />
              <Button
                className="flex items-center gap-2"
                onClick={() => handleCopyKey(createdApiKey)}
                size="sm"
                variant="outline"
              >
                <Copy size={16} />
                Copy
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {showCreateDialog && (
        <Card variant="outlined">
          <CardBody className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="key-name"
              >
                Key Name
              </label>
              <Input
                className="bg-white/5!"
                id="key-name"
                onChange={(v) => setNewKeyName(v)}
                placeholder="e.g., CI/CD Pipeline"
                value={newKeyName}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="key-scopes"
              >
                Scopes
              </label>
              <Input
                className="bg-white/5!"
                id="key-scopes"
                onChange={(v) => setNewKeyScopes(v)}
                placeholder="e.g., * (all scopes)"
                value={newKeyScopes}
              />
              <p className="text-xs text-white/30 mt-1">
                Use * for full access or comma-separated scopes
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="key-expires"
              >
                Expiration Date (Optional)
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                id="key-expires"
                onChange={(e) => setNewKeyExpiresAt(e.target.value)}
                placeholder="e.g., 2025-12-31"
                type="date"
                value={newKeyExpiresAt}
              />
              <p className="text-xs text-white/30 mt-1">Leave empty for no expiration</p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={createApiKeyMutation.isPending}
                onClick={handleCreateKey}
                variant="primary"
              >
                {createApiKeyMutation.isPending ? (
                  <>
                    <Loader2
                      className="animate-spin mr-2"
                      size={16}
                    />
                    Creating...
                  </>
                ) : (
                  "Create Key"
                )}
              </Button>
              <Button
                disabled={createApiKeyMutation.isPending}
                onClick={() => setShowCreateDialog(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {apiKeys.length === 0 && !showCreateDialog ? (
        <Card variant="outlined">
          <CardBody className="py-8 text-center">
            <Key
              className="mx-auto mb-3 text-muted-text/50"
              size={32}
            />
            <p className="text-sm text-white/40">No API keys found</p>
            <p className="text-xs text-white/20 mt-1">
              Create an API key to enable programmatic access
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card
              key={key.id}
              variant="outlined"
            >
              <CardBody className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Key
                      className="text-accent"
                      size={18}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white/90 truncate">{key.name}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                      <span>Scopes: {key.scopes}</span>
                      <span>•</span>
                      <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                      {key.lastUsedAt && (
                        <>
                          <span>•</span>
                          <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                        </>
                      )}
                      {key.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      key.revokedAt
                        ? "bg-red-500/10 text-red-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    {key.revokedAt ? "Revoked" : "Active"}
                  </span>
                  {!key.revokedAt && (
                    <Button
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDeleteKey(key.id, key.name)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
