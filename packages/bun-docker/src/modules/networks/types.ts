// ============================================================================
// Network Types
// ============================================================================

/**
 * Network configuration and state
 */
export interface Network {
  Name?: string
  Id?: string
  Created?: number
  Scope?: string
  Driver?: string
  EnableIPv4?: boolean
  EnableIPv6?: boolean
  IPAM?: IPAM
  Internal?: boolean
  Attachable?: boolean
  Ingress?: boolean
  ConfigFrom?: ConfigReference
  ConfigOnly?: boolean
  Options?: Record<string, string>
  Labels?: Record<string, string>
  Peers?: PeerInfo[]
}

/**
 * Network summary (extends Network)
 */
export interface NetworkSummary extends Network {}

/**
 * Full network inspection details
 */
export interface NetworkInspect extends Network {
  Containers?: Record<string, EndpointResource>
  Services?: Record<string, ServiceInfo>
  Status?: NetworkStatus
}

/**
 * Network status information
 */
export interface NetworkStatus {
  IPAM?: IPAMStatus
}

/**
 * Service information in a network
 */
export interface ServiceInfo {
  VIP?: string
  Ports?: string[]
  LocalLBIndex?: number
  Tasks?: NetworkTaskInfo[]
}

/**
 * Task information in a network
 */
export interface NetworkTaskInfo {
  Name?: string
  EndpointID?: string
  EndpointIP?: string
  MacAddress?: string
  IPv4Address?: string
  IPv6Address?: string
}

/**
 * Config reference for network
 */
export interface ConfigReference {
  Network?: string
}

/**
 * IPAM configuration
 */
export interface IPAM {
  Driver?: string
  Config?: IPAMConfig[]
  Options?: Record<string, string>
}

/**
 * IPAM configuration entry
 */
export interface IPAMConfig {
  Subnet?: string
  IPRange?: string
  Gateway?: string
  AuxiliaryAddresses?: Record<string, string>
}

/**
 * IPAM status
 */
export interface IPAMStatus {
  Subnets?: Record<string, SubnetStatus>
}

/**
 * Subnet status
 */
export interface SubnetStatus {
  IPsInUse?: number
  DynamicIPsAvailable?: number
}

/**
 * Endpoint resource information
 */
export interface EndpointResource {
  Name?: string
  EndpointID?: string
  MacAddress?: string
  IPv4Address?: string
  IPv6Address?: string
}

/**
 * Peer information
 */
export interface PeerInfo {
  Name?: string
  IP?: string
}

/**
 * Network create response
 */
export interface NetworkCreateResponse {
  Id?: string
  Warning?: string
}

/**
 * Network connect request
 */
export interface NetworkConnectRequest {
  Container?: string
  EndpointConfig?: EndpointSettings
}

/**
 * Network disconnect request
 */
export interface NetworkDisconnectRequest {
  Container?: string
  Force?: boolean
}

/**
 * Endpoint settings
 */
export interface EndpointSettings {
  IPAMConfig?: EndpointIPAMConfig
  Links?: string[]
  Aliases?: string[]
  NetworkID?: string
  EndpointID?: string
  Gateway?: string
  IPAddress?: string
  IPPrefixLen?: number
  IPv6Gateway?: string
  GlobalIPv6Address?: string
  GlobalIPv6PrefixLen?: number
  MacAddress?: string
  DriverOpts?: Record<string, string>
}

/**
 * Endpoint IPAM configuration
 */
export interface EndpointIPAMConfig {
  IPv4Address?: string
  IPv6Address?: string
  LinkLocalIPs?: string[]
}

/**
 * Network prune response
 */
export interface NetworkPruneResponse {
  NetworksDeleted?: string[]
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * List networks options
 */
export interface ListNetworksOptions {
  filters?: {
    dangling?: boolean[]
    driver?: string[]
    id?: string[]
    label?: string[]
    name?: string[]
    scope?: string[]
    type?: string[]
  }
}

/**
 * Create network options
 */
export interface CreateNetworkOptions {
  Name: string
  CheckDuplicate?: boolean
  Driver?: string
  Internal?: boolean
  Attachable?: boolean
  Ingress?: boolean
  IPAM?: IPAM
  EnableIPv6?: boolean
  Options?: Record<string, string>
  Labels?: Record<string, string>
  Scope?: string
}

/**
 * Inspect network options
 */
export interface InspectNetworkOptions {
  verbose?: boolean
  scope?: string
}

/**
 * Connect network options
 */
export interface ConnectNetworkOptions {
  Container?: string
  EndpointConfig?: EndpointSettings
}

/**
 * Disconnect network options
 */
export interface DisconnectNetworkOptions {
  Container?: string
  Force?: boolean
}

/**
 * Prune networks options
 */
export interface PruneNetworksOptions {
  filters?: {
    dangling?: boolean[]
    label?: string[]
    until?: string[]
  }
}
