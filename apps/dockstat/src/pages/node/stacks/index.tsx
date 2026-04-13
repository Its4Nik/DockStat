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
      toast({ title: "Name and YAML are required", variant: "error" })
      return
    }

    setLoading(true)
    try {
      await onSubmit({ env, name, yaml })
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="lg"
      title={initialData ? "Edit Stack" : "Create Stack"}
    >
      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="stack-name"
          >
            Stack Name
          </label>
          <Input
            disabled={!!initialData}
            id="stack-name"
            onChange={setName}
            placeholder="my-stack"
            value={name}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="compose-yaml"
          >
            Docker Compose YAML
          </label>
          <textarea
            className="w-full h-64 px-3 py-2 font-mono text-sm bg-main-bg border border-input-default-border rounded-md focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            id="compose-yaml"
            onChange={(e) => setYaml(e.target.value)}
            placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx"
            value={yaml}
          />
        </div>

        <div>
          <div className="block text-sm font-medium mb-1">Environment Variables</div>
          <div className="flex gap-2 mb-2">
            <Input
              className="flex-1"
              onChange={setEnvKey}
              placeholder="KEY"
              value={envKey}
            />
            <Input
              className="flex-1"
              onChange={setEnvValue}
              placeholder="value"
              value={envValue}
            />
            <Button
              onClick={handleAddEnv}
              variant="outline"
            >
              Add
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(env).map(([key, value]) => (
              <div
                className="flex items-center justify-between bg-main-bg/50 p-2 rounded"
                key={key}
              >
                <span className="font-mono text-sm">
                  <span className="text-accent">{key}</span>=
                  <span className="text-muted-text">{value}</span>
                </span>
                <Button
                  onClick={() => handleRemoveEnv(key)}
                  size="xs"
                  variant="ghost"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={handleSubmit}
          >
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
            level: line.toLowerCase().includes("error")
              ? "error"
              : line.toLowerCase().includes("warn")
                ? "warn"
                : "info",
            message: line,
            timestamp: new Date().toISOString(),
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
    debug: "text-muted-text",
    error: "text-error",
    info: "text-primary-text",
    warn: "text-yellow-400",
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="xl"
      title={`Logs: ${stackName}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label
            className="text-sm"
            htmlFor="log-lines"
          >
            Lines:
          </label>
          <Input
            className="w-24"
            id="log-lines"
            onChange={(v) => setTail(Number(v) || 100)}
            type="number"
            value={String(tail)}
          />
          <Button
            loading={loading}
            onClick={fetchLogs}
            variant="outline"
          >
            Refresh
          </Button>
        </div>

        <div className="bg-main-bg/80 border border-card-outlined-border rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-text text-center">No logs available</div>
          ) : (
            logs.map((log, i) => (
              <div
                className={`${levelColors[log.level]} whitespace-pre-wrap`}
                key={`log-${i}-${log.timestamp}`}
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
          <Button
            onClick={onClose}
            variant="outline"
          >
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
      toast({ title: "Swarm initialized successfully", variant: "success" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to initialize swarm", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="md"
      title="Initialize Swarm"
    >
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Initialize a new Docker Swarm cluster. This node will become the first manager.
        </p>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="advertise-addr"
          >
            Advertise Address (optional)
          </label>
          <Input
            id="advertise-addr"
            onChange={setAdvertiseAddr}
            placeholder="e.g., 192.168.1.100"
            value={advertiseAddr}
          />
          <p className="text-xs text-muted-text mt-1">
            The IP address that other nodes will use to join the swarm.
          </p>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="listen-addr"
          >
            Listen Address
          </label>
          <Input
            id="listen-addr"
            onChange={setListenAddr}
            placeholder="0.0.0.0:2377"
            value={listenAddr}
          />
          <p className="text-xs text-muted-text mt-1">
            The address to listen for inbound cluster management traffic.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={handleInit}
          >
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
      toast({ title: "Join token and remote address are required", variant: "error" })
      return
    }

    setLoading(true)
    try {
      await api.node({ nodeId }).swarm.join.post({
        joinToken,
        remoteAddrs: [remoteAddr],
      })
      toast({ title: "Joined swarm successfully", variant: "success" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to join swarm", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="md"
      title="Join Swarm"
    >
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Join an existing Docker Swarm cluster as a worker or manager.
        </p>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="join-token"
          >
            Join Token *
          </label>
          <Input
            id="join-token"
            onChange={setJoinToken}
            placeholder="SWMTKN-1-..."
            value={joinToken}
          />
          <p className="text-xs text-muted-text mt-1">
            The join token from an existing swarm manager. Use the worker token to join as a worker,
            or manager token to join as a manager.
          </p>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="remote-addr"
          >
            Remote Address *
          </label>
          <Input
            id="remote-addr"
            onChange={setRemoteAddr}
            placeholder="192.168.1.100:2377"
            value={remoteAddr}
          />
          <p className="text-xs text-muted-text mt-1">Address of an existing swarm manager node.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={handleJoin}
          >
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
      toast({ title: "Stack name and compose file are required", variant: "error" })
      return
    }

    setLoading(true)
    try {
      await api.node({ nodeId }).swarm.stacks.deploy.post({
        composeFile,
        name,
        withRegistryAuth,
      })
      toast({ title: "Swarm stack deployed successfully", variant: "success" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to deploy swarm stack", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="lg"
      title="Deploy Swarm Stack"
    >
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Deploy a stack to the Docker Swarm cluster using a compose file.
        </p>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="swarm-stack-name"
          >
            Stack Name *
          </label>
          <Input
            id="swarm-stack-name"
            onChange={setName}
            placeholder="my-swarm-stack"
            value={name}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="swarm-compose-yaml"
          >
            Docker Compose YAML *
          </label>
          <textarea
            className="w-full h-64 px-3 py-2 font-mono text-sm bg-main-bg border border-input-default-border rounded-md focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            id="swarm-compose-yaml"
            onChange={(e) => setComposeFile(e.target.value)}
            placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx&#10;    deploy:&#10;      replicas: 3"
            value={composeFile}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            checked={withRegistryAuth}
            className="rounded border-input-default-border"
            id="withRegistryAuth"
            onChange={(e) => setWithRegistryAuth(e.target.checked)}
            type="checkbox"
          />
          <label
            className="text-sm"
            htmlFor="withRegistryAuth"
          >
            Send registry authentication details
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={handleDeploy}
          >
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
      toast({ title: "Repository URL and stack name are required", variant: "error" })
      return
    }

    setLoading(true)
    try {
      await api.node({ nodeId }).stacks.fromStore.post({
        nodeId: Number(nodeId),
        repoUrl,
        stackName,
      })
      toast({ title: "Stack deployed from DockStore successfully", variant: "success" })
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to deploy stack from DockStore", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="md"
      title="Deploy from DockStore"
    >
      <div className="space-y-4">
        <p className="text-muted-text text-sm">
          Deploy a stack from a DockStore repository containing pre-built stack templates.
        </p>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="repo-url"
          >
            Repository URL *
          </label>
          <Input
            id="repo-url"
            onChange={setRepoUrl}
            placeholder="https://github.com/user/dockstore-repo"
            value={repoUrl}
          />
          <p className="text-xs text-muted-text mt-1">
            URL of a DockStore repository containing stack templates.
          </p>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="dockstore-stack-name"
          >
            Stack Name *
          </label>
          <Input
            id="dockstore-stack-name"
            onChange={setStackName}
            placeholder="nginx-stack"
            value={stackName}
          />
          <p className="text-xs text-muted-text mt-1">
            Name of the stack folder in the repository&apos;s stacks directory.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={handleDeploy}
          >
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
    <Card
      className="p-4 mt-4"
      variant="outlined"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Join Tokens</h3>
        <Button
          onClick={() => setShowTokens(!showTokens)}
          size="xs"
          variant="ghost"
        >
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
            <Button
              onClick={onLeave}
              size="sm"
              variant="outline"
            >
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
      toast({ title: "Failed to fetch stacks", variant: "error" })
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
        dockNodeId: Number(effectiveNodeId),
        env: data.env,
        name: data.name,
        repoName: data.name,
        repository: "local",
        version: "1.0.0",
        yaml: data.yaml,
      })
      toast({ title: "Stack created successfully", variant: "success" })
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
          env: data.env,
          yaml: data.yaml,
        })
      toast({ title: "Stack updated successfully", variant: "success" })
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
      toast({ title: "Stack deleted successfully", variant: "success" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to delete stack", variant: "error" })
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
          description: resultData.error || resultData.stderr || "Unknown error",
          title: `Stack ${action} failed`,
          variant: "error",
        })
      } else {
        toast({ title: `Stack ${action} initiated`, variant: "success" })
      }
      fetchData()
    } catch (error) {
      console.error(error)
      toast({ title: `Failed to ${action} stack`, variant: "error" })
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
      toast({ title: "Left swarm successfully", variant: "success" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to leave swarm", variant: "error" })
    }
  }

  // Table columns
  const composeColumns: Column<Stack>[] = [
    { header: "ID", key: "id", width: "60px" },
    { header: "Name", key: "name", width: "200px" },
    { header: "Version", key: "version", width: "100px" },
    {
      header: "Repository",
      key: "repository",
      render: (value) => (
        <span
          className="truncate block"
          title={String(value)}
        >
          {String(value)}
        </span>
      ),
      width: "200px",
    },
    {
      header: "Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex gap-1 flex-wrap">
          <Button
            onClick={() => handleStackAction(row.id, "up")}
            size="xs"
            variant="ghost"
          >
            Up
          </Button>
          <Button
            onClick={() => handleStackAction(row.id, "down")}
            size="xs"
            variant="ghost"
          >
            Down
          </Button>
          <Button
            onClick={() => handleStackAction(row.id, "restart")}
            size="xs"
            variant="ghost"
          >
            Restart
          </Button>
          <Button
            onClick={() => handleViewLogs(row.id, row.name)}
            size="xs"
            variant="ghost"
          >
            Logs
          </Button>
          <Button
            onClick={() => {
              setSelectedStack(row)
              setShowEditModal(true)
            }}
            size="xs"
            variant="ghost"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteStack(row.id)}
            size="xs"
            variant="ghost"
          >
            Delete
          </Button>
        </div>
      ),
      width: "300px",
    },
  ]

  const swarmColumns: Column<SwarmStack>[] = [
    { header: "Stack Name", key: "name", width: "200px" },
    {
      header: "Services",
      key: "services",
      render: (services) => (
        <div className="flex flex-wrap gap-1">
          {(services as SwarmService[]).map((s) => (
            <Badge
              key={s.id}
              size="sm"
              variant="default"
            >
              {s.name} ({s.replicas.running}/{s.replicas.desired})
            </Badge>
          ))}
        </div>
      ),
      width: "300px",
    },
    {
      header: "Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            onClick={async () => {
              try {
                await api
                  .node({ nodeId: effectiveNodeId })
                  .swarm.stacks({ name: row.name })
                  .delete()
                toast({ title: "Stack removed", variant: "success" })
                fetchData()
              } catch {
                toast({ title: "Failed to remove stack", variant: "error" })
              }
            }}
            size="xs"
            variant="ghost"
          >
            Remove
          </Button>
        </div>
      ),
      width: "150px",
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
          <Button
            onClick={() => setShowDockStoreModal(true)}
            variant="outline"
          >
            From DockStore
          </Button>
        </div>
      </div>

      {/* Swarm Actions (when not in swarm) */}
      {!isInSwarm && (
        <Card
          className="p-4"
          variant="outlined"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Docker Swarm</h3>
              <p className="text-sm text-muted-text">
                This node is not part of a swarm. Initialize a new swarm or join an existing one.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowSwarmInitModal(true)}>Initialize Swarm</Button>
              <Button
                onClick={() => setShowSwarmJoinModal(true)}
                variant="outline"
              >
                Join Swarm
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Swarm Tokens (when manager) */}
      {swarmStatus?.isSwarmManager && (
        <SwarmTokens
          onLeave={handleLeaveSwarm}
          swarmStatus={swarmStatus}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-card-outlined-border pb-2">
        <Button
          onClick={() => setActiveTab("compose")}
          variant={activeTab === "compose" ? "primary" : "ghost"}
        >
          Compose Stacks
        </Button>
        {swarmStatus?.isSwarmManager && (
          <Button
            onClick={() => setActiveTab("swarm")}
            variant={activeTab === "swarm" ? "primary" : "ghost"}
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
        <Card
          className="p-8 text-center text-muted-text"
          variant="outlined"
        >
          Loading stacks...
        </Card>
      ) : activeTab === "compose" ? (
        <Card
          size="sm"
          variant="outlined"
        >
          <Table
            columns={composeColumns}
            data={stacks}
            rowKey="id"
            searchable
            searchPlaceholder="Search stacks..."
          />
        </Card>
      ) : (
        <Card
          size="sm"
          variant="outlined"
        >
          <Table
            columns={swarmColumns}
            data={swarmStacks}
            rowKey="name"
            searchable
            searchPlaceholder="Search swarm stacks..."
          />
        </Card>
      )}

      {/* Modals */}
      <StackFormModal
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateStack}
        open={showCreateModal}
      />

      <StackFormModal
        initialData={selectedStack}
        onClose={() => {
          setShowEditModal(false)
          setSelectedStack(null)
        }}
        onSubmit={handleUpdateStack}
        open={showEditModal}
      />

      <StackLogsModal
        nodeId={effectiveNodeId}
        onClose={() => setShowLogsModal(false)}
        open={showLogsModal}
        stackId={logsStackId}
        stackName={logsStackName}
      />

      <SwarmInitModal
        nodeId={effectiveNodeId}
        onClose={() => setShowSwarmInitModal(false)}
        onSuccess={fetchData}
        open={showSwarmInitModal}
      />

      <SwarmJoinModal
        nodeId={effectiveNodeId}
        onClose={() => setShowSwarmJoinModal(false)}
        onSuccess={fetchData}
        open={showSwarmJoinModal}
      />

      <SwarmStackDeployModal
        nodeId={effectiveNodeId}
        onClose={() => setShowSwarmStackDeployModal(false)}
        onSuccess={fetchData}
        open={showSwarmStackDeployModal}
      />

      <DockStoreStackModal
        nodeId={effectiveNodeId}
        onClose={() => setShowDockStoreModal(false)}
        onSuccess={fetchData}
        open={showDockStoreModal}
      />
    </div>
  )
}
