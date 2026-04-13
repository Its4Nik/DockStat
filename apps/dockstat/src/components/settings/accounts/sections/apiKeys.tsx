import type { Column } from "@dockstat/ui"
import { Badge, Button, Card, CardBody, Divider, Input, Table, Toggle } from "@dockstat/ui"
import { Copy, Key, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import type { ApiKey } from "./useAccounts"

interface ApiKeysSectionProps {
  apiKeys: ApiKey[]
  createApiKey: (data: { name: string; referenceId: string }) => void
  deleteApiKey: (id: string) => void
  toggleApiKey: (id: string, enabled: boolean) => void
}

export function ApiKeysSection({
  apiKeys,
  createApiKey,
  deleteApiKey,
  toggleApiKey,
}: ApiKeysSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyReference, setNewKeyReference] = useState("")

  const handleCreate = () => {
    if (!newKeyName || !newKeyReference) return
    createApiKey({ name: newKeyName, referenceId: newKeyReference })
    setNewKeyName("")
    setNewKeyReference("")
    setShowCreateForm(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const columns: Column<ApiKey>[] = [
    {
      key: "name",
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-muted-text" />
          <span className="font-medium text-primary-text">
            {value || `API Key ${record.id.slice(0, 8)}`}
          </span>
        </div>
      ),
      title: "Name",
      width: "30%",
    },
    {
      key: "key",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm bg-muted/10 px-2 py-1 rounded">
            {record.key.slice(0, 16)}...
          </code>
          <Button
            className="h-6 w-6 p-0"
            noFocusRing
            onClick={() => copyToClipboard(record.key)}
            size="xs"
            variant="ghost"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      ),
      title: "Key",
      width: "30%",
    },
    {
      key: "referenceId",
      render: (value) => <code className="font-mono text-sm text-muted-text">{value}</code>,
      title: "Reference ID",
      width: "15%",
    },
    {
      align: "center",
      key: "enabled",
      render: (value) => (
        <Badge
          size="sm"
          variant={value ? "success" : "secondary"}
        >
          {value ? "Active" : "Disabled"}
        </Badge>
      ),
      title: "Status",
      width: "10%",
    },
    {
      key: "expiresAt",
      render: (value) => (
        <span className="text-sm text-muted-text">{formatDate(String(value))}</span>
      ),
      title: "Expires",
      width: "10%",
    },
    {
      align: "center",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center gap-2 justify-center">
          <Toggle
            checked={record.enabled}
            className="h-6"
            onChange={() => toggleApiKey(record.id, !record.enabled)}
          />
          <Button
            className="h-7 px-2 text-destructive hover:text-destructive"
            noFocusRing
            onClick={() => deleteApiKey(record.id)}
            size="xs"
            variant="ghost"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
      title: "Actions",
      width: "10%",
    },
  ]

  return (
    <Card
      className="space-y-4"
      variant="elevated"
    >
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key
              className="text-accent"
              size={24}
            />
            <h2 className="text-2xl font-semibold text-primary-text">API Keys</h2>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="md"
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {showCreateForm && (
          <Card
            className="mb-4 p-4 bg-muted/5"
            variant="outlined"
          >
            <h3 className="font-semibold text-primary-text mb-3">Create New API Key</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">Name</label>
                <Input
                  onChange={(e) => setNewKeyName(e)}
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">
                  Reference ID
                </label>
                <Input
                  onChange={(e) => setNewKeyReference(e)}
                  placeholder="e.g., user-123 or service-xyz"
                  value={newKeyReference}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  size="sm"
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewKeyName("")
                    setNewKeyReference("")
                  }}
                  size="sm"
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Divider variant="dotted" />

        {apiKeys.length === 0 ? (
          <Card
            className="p-8 text-center bg-muted/5"
            variant="outlined"
          >
            <Key className="w-12 h-12 mx-auto text-muted-text/40 mb-3" />
            <h3 className="text-lg font-semibold text-primary-text mb-2">No API Keys Found</h3>
            <p className="text-sm text-muted-text mb-4">
              Create an API key to enable programmatic access to your DockStat instance.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First API Key
            </Button>
          </Card>
        ) : (
          <div className="mt-4">
            <div className="mb-3">
              <p className="text-sm text-muted-text">
                Manage your API keys for programmatic access. Keep your keys secure and rotate them
                regularly.
              </p>
            </div>
            <Table
              bordered
              columns={columns}
              data={apiKeys}
              hoverable
              rowKey="id"
              searchable
              searchPlaceholder="Search API keys..."
              size="md"
              striped
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}
