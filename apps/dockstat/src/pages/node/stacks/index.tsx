import { Badge, Button, Card, type Column, Input, Modal, Table } from "@dockstat/ui"
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast"

// ============================================
// Types
// ============================================

interface Stack {
  id: number
  name: string
  version: string
  repository: string
  stack: string
  yaml: string
  env: Record<string, string | number | boolean | null>
  dockNodeId: number
}

interface SwarmStack {
  name: string
  services: SwarmService[]
  networks: SwarmNetwork[]
}

interface SwarmService {
  id: string
  name: string
  mode: string
  replicas: {
    running: number
    desired: number
    failed: number
    pending: number
  }
  image: string
  ports: Array<{
    publishedPort: number
    targetPort: number
    protocol: string
    mode: string
  }>
  stackName: string
}

interface SwarmNetwork {
  id: string
  name: string
  driver: string
  scope: string
}

interface SwarmStatus {
  isSwarmManager: boolean
  isSwarmWorker: boolean
  nodeCount: number
  managerCount: number
  swarmId?: string
  joinTokens?: {
    manager: string
    worker: string
  }
}

interface LogMessage {
  timestamp: string
  message: string
  level: "info" | "warn" | "error" | "debug"
}

// ============================================
// Stack Create/Edit Modal
// ============================================

interface StackFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; yaml: string; env: Record<string, string> }) => Promise<void>
  initialData?: Stack | null
}

function StackFormModal({ open, onClose, onSubmit, initialData }: StackFormModalProps) {
  const [name, setName] = useState("")
  const [yaml, setYaml] = useState("")
  const [envKey, setEnvKey] = useState("")
  const [envValue, setEnvValue] = useState("")
  const [env, setEnv] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setYaml(initialData.yaml)
      setEnv(
        Object.fromEntries(
          Object.entries(initialData.env || {}).map(([k, v]) => [k, String(v ?? "")])
        )
      )
    } else {
      setName("")
      setYaml("")
      setEnv({})
    }
  }, [initialData])

  const handleAddEnv = () => {
    if (envKey.trim()) {
      setEnv((prev) => ({ ...prev, [envKey.trim()]: envValue }))
      setEnvKey("")
      setEnvValue("")
    }
  }

  const handleRemoveEnv = (key: string) => {
    setEnv((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async () => {
    if (!name.trim() || !yaml.trim()) {
      toast({ variant: "error", title: "Name and YAML are required" })
      return
    }

    setLoading(true)
    try {
      await onSubmit({ name, yaml, env })
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Stack" : "Create Stack"}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="stack-name" className="block text-sm font-medium mb-1">
            Stack Name
          </label>
          <Input
            id="stack-name"
            value={name}
            onChange={setName}
            placeholder="my-stack"
            disabled={!!initialData}
          />
        </div>

        <div>
          <label htmlFor="compose-yaml" className="block text-sm font-medium mb-1">
            Docker Compose YAML
          </label>
          <textarea
            id="compose-yaml"
            className="w-full h-64 px-3 py-2 font-mono text-sm bg-main-bg border border-input-default-border rounded-md focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            value={yaml}
            onChange={(e) => setYaml(e.target.value)}
            placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Environment Variables</label>
          <div className="flex gap-2 mb-2">
            <Input value={envKey} onChange={setEnvKey} placeholder="KEY" className="flex-1" />
            <Input value={envValue} onChange={setEnvValue} placeholder="value" className="flex-1" />
            <Button variant="outline" onClick={handleAddEnv}>
              Add
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(env).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-main-bg/50 p-2 rounded"
              >
                <span className="font-mono text-sm">
                  <span className="text-accent">{key}</span>=
                  <span className="text-muted-text">{value}</span>
                </span>
                <Button variant="ghost" size="xs" onClick={() => handleRemoveEnv(key)}>
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// Stack Logs Modal
// ============================================

interface StackLogsModalProps {
  open: boolean
  onClose: () => void
  nodeId: string
  stackId: number | null
  stackName: string
}

function StackLogsModal({ open, onClose, nodeId, stackId, stackName }: StackLogsModalProps) {
  const [logs, setLogs] = useState<LogMessage[]>([])
  const [tail, setTail] = useState(100)
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!stackId) return

    setLoading(true)
    try {
      const result = await api
        .node({ nodeId })
        .stacks({ stackId: String(stackId) })
        .logs.get({
          query: { tail: String(tail) },
        })

      if (result.data) {
        // Parse the logs - could be string or structured data
        const logText = String(result.data)
        const logLines = logText.split("\n").filter(Boolean)
        setLogs(
          logLines.map((line) => ({
            timestamp: new Date().toISOString(),
            message: line,
            level: line.toLowerCase().includes("error")
              ? "error"
              : line.toLowerCase().includes("warn")
                ? "warn"
                : "info",
          }))
        )
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }, [nodeId, stackId, tail])

  useEffect(() => {
    if (open && stackId) {
      fetchLogs()
    }
  }, [open, stackId, fetchLogs])

  const levelColors = {
    info: "text-primary-text",
    warn: "text-yellow-400",
    error: "text-error",
    debug: "text-muted-text",
  }

  return (
    <Modal open={open} onClose={onClose} title={`Logs: ${stackName}`} size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label htmlFor="log-lines" className="text-sm">
            Lines:
          </label>
          <Input
            id="log-lines"
            type="number"
            value={String(tail)}
            onChange={(v) => setTail(Number(v) || 100)}
            className="w-24"
          />
          <Button variant="outline" onClick={fetchLogs} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="bg-main-bg/80 border border-card-outlined-border rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-text text-center">No logs available</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={`log-${i}-${log.timestamp}`}
                className={`${levelColors[log.level]} whitespace-pre-wrap`}
              >
                <span className="text-muted-text mr-2">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                {log.message}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// Swarm Init Modal
// ============================================

interface SwarmInitModalProps {
  open: boolean
  onClose: () => void
  nodeId: string
  onSuccess: () => void
}

function SwarmInitModal({ open, onClose, nodeId, onSuccess }: SwarmInitModalProps) {
  const [advertiseAddr, setAdvertiseAddr] = useState("")
  const [listenAddr, setListenAddr] = useState("0.0.0.0:2377")
  const [loading, setLoading] = useState(false)

  const handleInit = async () => {
    setLoading(true)
    try {
      await api.node({ nodeId }).swarm.init.post({
        advertiseAddr: advertiseAddr || undefined,
        listenAddr: listenAddr || undefined,
      })
      toast({ variant: "success", title: "Swarm initialized successfully" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: "Failed to initialize swarm" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Initialize Swarm" size="md">
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Initialize a new Docker Swarm cluster. This node will become the first manager.
        </p>

        <div>
          <label htmlFor="advertise-addr" className="block text-sm font-medium mb-1">
            Advertise Address (optional)
          </label>
          <Input
            id="advertise-addr"
            value={advertiseAddr}
            onChange={setAdvertiseAddr}
            placeholder="e.g., 192.168.1.100"
          />
          <p className="text-xs text-muted-text mt-1">
            The IP address that other nodes will use to join the swarm.
          </p>
        </div>

        <div>
          <label htmlFor="listen-addr" className="block text-sm font-medium mb-1">
            Listen Address
          </label>
          <Input
            id="listen-addr"
            value={listenAddr}
            onChange={setListenAddr}
            placeholder="0.0.0.0:2377"
          />
          <p className="text-xs text-muted-text mt-1">
            The address to listen for inbound cluster management traffic.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInit} loading={loading}>
            Initialize Swarm
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// Swarm Join Modal
// ============================================

interface SwarmJoinModalProps {
  open: boolean
  onClose: () => void
  nodeId: string
  onSuccess: () => void
}

function SwarmJoinModal({ open, onClose, nodeId, onSuccess }: SwarmJoinModalProps) {
  const [joinToken, setJoinToken] = useState("")
  const [remoteAddr, setRemoteAddr] = useState("")
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!joinToken.trim() || !remoteAddr.trim()) {
      toast({ variant: "error", title: "Join token and remote address are required" })
      return
    }

    setLoading(true)
    try {
      await api.node({ nodeId }).swarm.join.post({
        joinToken,
        remoteAddrs: [remoteAddr],
      })
      toast({ variant: "success", title: "Joined swarm successfully" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: "Failed to join swarm" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join Swarm" size="md">
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Join an existing Docker Swarm cluster as a worker or manager.
        </p>

        <div>
          <label htmlFor="join-token" className="block text-sm font-medium mb-1">
            Join Token *
          </label>
          <Input
            id="join-token"
            value={joinToken}
            onChange={setJoinToken}
            placeholder="SWMTKN-1-..."
          />
          <p className="text-xs text-muted-text mt-1">
            The join token from an existing swarm manager. Use the worker token to join as a worker,
            or manager token to join as a manager.
          </p>
        </div>

        <div>
          <label htmlFor="remote-addr" className="block text-sm font-medium mb-1">
            Remote Address *
          </label>
          <Input
            id="remote-addr"
            value={remoteAddr}
            onChange={setRemoteAddr}
            placeholder="192.168.1.100:2377"
          />
          <p className="text-xs text-muted-text mt-1">Address of an existing swarm manager node.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleJoin} loading={loading}>
            Join Swarm
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// Swarm Stack Deploy Modal
// ============================================

interface SwarmStackDeployModalProps {
  open: boolean
  onClose: () => void
  nodeId: string
  onSuccess: () => void
}

function SwarmStackDeployModal({ open, onClose, nodeId, onSuccess }: SwarmStackDeployModalProps) {
  const [name, setName] = useState("")
  const [composeFile, setComposeFile] = useState("")
  const [withRegistryAuth, setWithRegistryAuth] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDeploy = async () => {
    if (!name.trim() || !composeFile.trim()) {
      toast({ variant: "error", title: "Stack name and compose file are required" })
      return
    }

    setLoading(true)
    try {
      await api.node({ nodeId }).swarm.stacks.deploy.post({
        name,
        composeFile,
        withRegistryAuth,
      })
      toast({ variant: "success", title: "Swarm stack deployed successfully" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: "Failed to deploy swarm stack" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deploy Swarm Stack" size="lg">
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Deploy a stack to the Docker Swarm cluster using a compose file.
        </p>

        <div>
          <label htmlFor="swarm-stack-name" className="block text-sm font-medium mb-1">
            Stack Name *
          </label>
          <Input
            id="swarm-stack-name"
            value={name}
            onChange={setName}
            placeholder="my-swarm-stack"
          />
        </div>

        <div>
          <label htmlFor="swarm-compose-yaml" className="block text-sm font-medium mb-1">
            Docker Compose YAML *
          </label>
          <textarea
            id="swarm-compose-yaml"
            className="w-full h-64 px-3 py-2 font-mono text-sm bg-main-bg border border-input-default-border rounded-md focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            value={composeFile}
            onChange={(e) => setComposeFile(e.target.value)}
            placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx&#10;    deploy:&#10;      replicas: 3"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="withRegistryAuth"
            checked={withRegistryAuth}
            onChange={(e) => setWithRegistryAuth(e.target.checked)}
            className="rounded border-input-default-border"
          />
          <label htmlFor="withRegistryAuth" className="text-sm">
            Send registry authentication details
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} loading={loading}>
            Deploy Stack
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// DockStore Stack Modal
// ============================================

interface DockStoreStackModalProps {
  open: boolean
  onClose: () => void
  nodeId: string
  onSuccess: () => void
}

function DockStoreStackModal({ open, onClose, nodeId, onSuccess }: DockStoreStackModalProps) {
  const [repoUrl, setRepoUrl] = useState("")
  const [stackName, setStackName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDeploy = async () => {
    if (!repoUrl.trim() || !stackName.trim()) {
      toast({ variant: "error", title: "Repository URL and stack name are required" })
      return
    }

    setLoading(true)
    try {
      await api.node({ nodeId }).stacks.fromStore.post({
        repoUrl,
        stackName,
        nodeId: Number(nodeId),
      })
      toast({ variant: "success", title: "Stack deployed from DockStore successfully" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: "Failed to deploy stack from DockStore" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deploy from DockStore" size="md">
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Deploy a stack from a DockStore repository containing pre-built stack templates.
        </p>

        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium mb-1">
            Repository URL *
          </label>
          <Input
            id="repo-url"
            value={repoUrl}
            onChange={setRepoUrl}
            placeholder="https://github.com/user/dockstore-repo"
          />
          <p className="text-xs text-muted-text mt-1">
            URL of a DockStore repository containing stack templates.
          </p>
        </div>

        <div>
          <label htmlFor="dockstore-stack-name" className="block text-sm font-medium mb-1">
            Stack Name *
          </label>
          <Input
            id="dockstore-stack-name"
            value={stackName}
            onChange={setStackName}
            placeholder="nginx-stack"
          />
          <p className="text-xs text-muted-text mt-1">
            Name of the stack folder in the repository&apos;s stacks directory.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} loading={loading}>
            Deploy Stack
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// Swarm Token Display
// ============================================

interface SwarmTokensProps {
  swarmStatus: SwarmStatus
  onLeave: () => void
}

function SwarmTokens({ swarmStatus, onLeave }: SwarmTokensProps) {
  const [showTokens, setShowTokens] = useState(false)

  if (!swarmStatus.isSwarmManager || !swarmStatus.joinTokens) {
    return null
  }

  return (
    <Card variant="outlined" className="p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Join Tokens</h3>
        <Button variant="ghost" size="xs" onClick={() => setShowTokens(!showTokens)}>
          {showTokens ? "Hide" : "Show"}
        </Button>
      </div>
      {showTokens && (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Worker Token:</span>
            <code className="ml-2 text-xs bg-main-bg/50 p-1 rounded break-all">
              {swarmStatus.joinTokens.worker}
            </code>
          </div>
          <div>
            <span className="font-medium">Manager Token:</span>
            <code className="ml-2 text-xs bg-main-bg/50 p-1 rounded break-all">
              {swarmStatus.joinTokens.manager}
            </code>
          </div>
          <div className="mt-4 pt-2 border-t border-card-outlined-border">
            <Button variant="outline" size="sm" onClick={onLeave}>
              Leave Swarm
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ============================================
// Main Stacks Page
// ============================================

interface NodeStacksPageProps {
  nodeId?: string
}

export default function NodeStacksPage({ nodeId }: NodeStacksPageProps) {
  // State
  const [stacks, setStacks] = useState<Stack[]>([])
  const [swarmStacks, setSwarmStacks] = useState<SwarmStack[]>([])
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatus | null>(null)
  const [selectedStack, setSelectedStack] = useState<Stack | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [logsStackId, setLogsStackId] = useState<number | null>(null)
  const [logsStackName, setLogsStackName] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"compose" | "swarm">("compose")

  // Swarm modals
  const [showSwarmInitModal, setShowSwarmInitModal] = useState(false)
  const [showSwarmJoinModal, setShowSwarmJoinModal] = useState(false)
  const [showSwarmStackDeployModal, setShowSwarmStackDeployModal] = useState(false)
  const [showDockStoreModal, setShowDockStoreModal] = useState(false)

  // Use nodeId from props or default to first node
  const effectiveNodeId = nodeId || "1"

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch compose stacks
      const stacksResult = await api.node({ nodeId: effectiveNodeId }).stacks.get()
      if (stacksResult.data) {
        setStacks(Array.isArray(stacksResult.data) ? stacksResult.data : [])
      }

      // Fetch swarm status
      const swarmStatusResult = await api.node({ nodeId: effectiveNodeId }).swarm.status.get()
      if (swarmStatusResult.data) {
        setSwarmStatus(swarmStatusResult.data as SwarmStatus)
      }

      // Fetch swarm stacks if in swarm mode
      if ((swarmStatusResult.data as SwarmStatus)?.isSwarmManager) {
        const swarmStacksResult = await api.node({ nodeId: effectiveNodeId }).swarm.stacks.get()
        if (swarmStacksResult.data) {
          setSwarmStacks(Array.isArray(swarmStacksResult.data) ? swarmStacksResult.data : [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch stacks:", error)
      toast({ variant: "error", title: "Failed to fetch stacks" })
    } finally {
      setLoading(false)
    }
  }, [effectiveNodeId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers
  const handleCreateStack = async (data: {
    name: string
    yaml: string
    env: Record<string, string>
  }) => {
    try {
      await api.node({ nodeId: effectiveNodeId }).stacks.post({
        name: data.name,
        yaml: data.yaml,
        repository: "local",
        repoName: data.name,
        version: "1.0.0",
        env: data.env,
        dockNodeId: Number(effectiveNodeId),
      })
      toast({ variant: "success", title: "Stack created successfully" })
      fetchData()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const handleUpdateStack = async (data: {
    name: string
    yaml: string
    env: Record<string, string>
  }) => {
    if (!selectedStack) return
    try {
      await api
        .node({ nodeId: effectiveNodeId })
        .stacks({ stackId: String(selectedStack.id) })
        .patch({
          yaml: data.yaml,
          env: data.env,
        })
      toast({ variant: "success", title: "Stack updated successfully" })
      fetchData()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const handleDeleteStack = async (stackId: number) => {
    if (!confirm("Are you sure you want to delete this stack?")) return
    try {
      await api
        .node({ nodeId: effectiveNodeId })
        .stacks({ stackId: String(stackId) })
        .delete()
      toast({ variant: "success", title: "Stack deleted successfully" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: "Failed to delete stack" })
    }
  }

  const handleStackAction = async (stackId: number, action: "up" | "down" | "restart" | "stop") => {
    try {
      const result = await api
        .node({ nodeId: effectiveNodeId })
        .stacks({ stackId: String(stackId) })
        [action].post({})

      // Check for errors in the result
      const resultData = result.data as
        | { success?: boolean; error?: string; stderr?: string }
        | undefined
      if (resultData && !resultData.success) {
        toast({
          variant: "error",
          title: `Stack ${action} failed`,
          description: resultData.error || resultData.stderr || "Unknown error",
        })
      } else {
        toast({ variant: "success", title: `Stack ${action} initiated` })
      }
      fetchData()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: `Failed to ${action} stack` })
    }
  }

  const handleViewLogs = (stackId: number, stackName: string) => {
    setLogsStackId(stackId)
    setLogsStackName(stackName)
    setShowLogsModal(true)
  }

  const handleLeaveSwarm = async () => {
    if (!confirm("Are you sure you want to leave the swarm? This may affect running services."))
      return
    try {
      await api.node({ nodeId: effectiveNodeId }).swarm.leave.post({ query: { force: "true" } })
      toast({ variant: "success", title: "Left swarm successfully" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast({ variant: "error", title: "Failed to leave swarm" })
    }
  }

  // Table columns
  const composeColumns: Column<Stack>[] = [
    { key: "id", header: "ID", width: "60px" },
    { key: "name", header: "Name", width: "200px" },
    { key: "version", header: "Version", width: "100px" },
    {
      key: "repository",
      header: "Repository",
      width: "200px",
      render: (value) => (
        <span className="truncate block" title={String(value)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "300px",
      render: (_, row) => (
        <div className="flex gap-1 flex-wrap">
          <Button variant="ghost" size="xs" onClick={() => handleStackAction(row.id, "up")}>
            Up
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleStackAction(row.id, "down")}>
            Down
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleStackAction(row.id, "restart")}>
            Restart
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleViewLogs(row.id, row.name)}>
            Logs
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setSelectedStack(row)
              setShowEditModal(true)
            }}
          >
            Edit
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleDeleteStack(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const swarmColumns: Column<SwarmStack>[] = [
    { key: "name", header: "Stack Name", width: "200px" },
    {
      key: "services",
      header: "Services",
      width: "300px",
      render: (services) => (
        <div className="flex flex-wrap gap-1">
          {(services as SwarmService[]).map((s) => (
            <Badge key={s.id} variant="default" size="sm">
              {s.name} ({s.replicas.running}/{s.replicas.desired})
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "150px",
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={async () => {
              try {
                await api
                  .node({ nodeId: effectiveNodeId })
                  .swarm.stacks({ name: row.name })
                  .delete()
                toast({ variant: "success", title: "Stack removed" })
                fetchData()
              } catch {
                toast({ variant: "error", title: "Failed to remove stack" })
              }
            }}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ]

  const isInSwarm = swarmStatus?.isSwarmManager || swarmStatus?.isSwarmWorker

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stacks</h1>
          <p className="text-muted-text">Manage Docker Compose and Swarm stacks</p>
        </div>
        <div className="flex gap-2 items-center">
          {swarmStatus?.isSwarmManager && (
            <Badge variant="success">Swarm Manager ({swarmStatus.nodeCount} nodes)</Badge>
          )}
          {swarmStatus?.isSwarmWorker && <Badge variant="default">Swarm Worker</Badge>}
          {!swarmStatus?.isSwarmManager && !swarmStatus?.isSwarmWorker && (
            <Badge variant="outline">Standalone Mode</Badge>
          )}
          <Button onClick={() => setShowCreateModal(true)}>Create Stack</Button>
          <Button variant="outline" onClick={() => setShowDockStoreModal(true)}>
            From DockStore
          </Button>
        </div>
      </div>

      {/* Swarm Actions (when not in swarm) */}
      {!isInSwarm && (
        <Card variant="outlined" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Docker Swarm</h3>
              <p className="text-sm text-muted-text">
                This node is not part of a swarm. Initialize a new swarm or join an existing one.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowSwarmInitModal(true)}>Initialize Swarm</Button>
              <Button variant="outline" onClick={() => setShowSwarmJoinModal(true)}>
                Join Swarm
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Swarm Tokens (when manager) */}
      {swarmStatus?.isSwarmManager && (
        <SwarmTokens swarmStatus={swarmStatus} onLeave={handleLeaveSwarm} />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-card-outlined-border pb-2">
        <Button
          variant={activeTab === "compose" ? "primary" : "ghost"}
          onClick={() => setActiveTab("compose")}
        >
          Compose Stacks
        </Button>
        {swarmStatus?.isSwarmManager && (
          <Button
            variant={activeTab === "swarm" ? "primary" : "ghost"}
            onClick={() => setActiveTab("swarm")}
          >
            Swarm Stacks
          </Button>
        )}
      </div>

      {/* Swarm Stack Deploy Button */}
      {activeTab === "swarm" && swarmStatus?.isSwarmManager && (
        <div className="flex justify-end">
          <Button onClick={() => setShowSwarmStackDeployModal(true)}>Deploy Swarm Stack</Button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Card variant="outlined" className="p-8 text-center text-muted-text">
          Loading stacks...
        </Card>
      ) : activeTab === "compose" ? (
        <Card variant="outlined" size="sm">
          <Table
            data={stacks}
            columns={composeColumns}
            rowKey="id"
            searchable
            searchPlaceholder="Search stacks..."
          />
        </Card>
      ) : (
        <Card variant="outlined" size="sm">
          <Table
            data={swarmStacks}
            columns={swarmColumns}
            rowKey="name"
            searchable
            searchPlaceholder="Search swarm stacks..."
          />
        </Card>
      )}

      {/* Modals */}
      <StackFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateStack}
      />

      <StackFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedStack(null)
        }}
        onSubmit={handleUpdateStack}
        initialData={selectedStack}
      />

      <StackLogsModal
        open={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        nodeId={effectiveNodeId}
        stackId={logsStackId}
        stackName={logsStackName}
      />

      <SwarmInitModal
        open={showSwarmInitModal}
        onClose={() => setShowSwarmInitModal(false)}
        nodeId={effectiveNodeId}
        onSuccess={fetchData}
      />

      <SwarmJoinModal
        open={showSwarmJoinModal}
        onClose={() => setShowSwarmJoinModal(false)}
        nodeId={effectiveNodeId}
        onSuccess={fetchData}
      />

      <SwarmStackDeployModal
        open={showSwarmStackDeployModal}
        onClose={() => setShowSwarmStackDeployModal(false)}
        nodeId={effectiveNodeId}
        onSuccess={fetchData}
      />

      <DockStoreStackModal
        open={showDockStoreModal}
        onClose={() => setShowDockStoreModal(false)}
        nodeId={effectiveNodeId}
        onSuccess={fetchData}
      />
    </div>
  )
}
