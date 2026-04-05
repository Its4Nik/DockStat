import type { Resources } from "../../types"

type NodeFilters = {
  id?: string[]
  label?: string[]
  membership?: Array<"accepted" | "pending">
  name?: string[]
  "node.label"?: string[]
  role?: Array<"manager" | "worker">
}

export type ListNodesOptions = {
  filters: NodeFilters
}

export type NodeResponse = {
  ID: string
  Version: {
    Index: number
  }
  CreatedAt: string
  UpdatedAt: string
  Spec: {
    Name: string
    Labels: Record<string, string>
    Role: "worker" | "manager"
    Availability: "active" | "pause" | "drain"
  }
  Description: {
    Hostname: string
    Platform: {
      Architecture: string
      OS: string
    }
    Resources: {
      NanoCPUs: number
      MemoryBytes: number
      GenericResources: Resources
    }
    Engine: {
      EngineVersion: string
      Labels: Record<string, string>
      Plugins: Array<{ Type: string; Name: string }>
    }
    TLSInfo: {
      TrustRoot: string
      CertIssuerSubject: string
      CertIssuerPublicKey: string
    }
  }
  Status: {
    State: "unknown" | "down" | "ready" | "disconnected"
    Message: string
    Addr: string
  }
  ManagerStatus: {
    Leader: boolean
    Reachability: "unknown" | "unreachable" | "reachable"
    Addr: string
  } | null
}

export type NodeUpdateOptions = {
  Name: string
  Labels: Record<string, string>
  Role: "worker" | "manager"
  Availability: "active" | "pause" | "drain"
}
