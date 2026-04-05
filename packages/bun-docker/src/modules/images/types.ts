import type { BodyInit } from "bun"
import type { HealthCheck } from "../../types"

/**
 * Image summary information returned by list
 */
export interface ImageSummary {
  Id: string
  ParentId: string
  RepoTags: string[]
  RepoDigests: string[]
  Created: number
  Size: number
  SharedSize: number
  Labels?: Record<string, string>
  Containers: number
  Manifests?: ImageManifestSummary[]
  Descriptor?: OCIDescriptor
}

/**
 * Detailed image information returned by inspect
 */
export interface ImageInspect {
  Id: string
  Descriptor?: OCIDescriptor
  Identity?: Identity
  Manifests?: ImageManifestSummary[]
  RepoTags?: string[]
  RepoDigests?: string[]
  Comment?: string
  Created?: string
  Author?: string
  Config?: ImageConfig
  Architecture?: string
  Variant?: string
  Os?: string
  OsVersion?: string
  Size?: number
  GraphDriver?: GraphDriver
  RootFS?: RootFS
  Metadata?: ImageMetadata
}

/**
 * Image configuration
 */
export interface ImageConfig {
  User?: string
  ExposedPorts?: Record<string, object>
  Env?: string[]
  Cmd?: string[]
  Healthcheck?: HealthConfig
  ArgsEscaped?: boolean
  Volumes?: Record<string, object>
  WorkingDir?: string
  Entrypoint?: string[]
  OnBuild?: string[]
  Labels?: Record<string, string>
  StopSignal?: string
  Shell?: string[]
}

/**
 * Root filesystem information
 */
export interface RootFS {
  Type: string
  Layers: string[]
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  LastTagTime?: string
}

/**
 * Graph driver information
 */
export interface GraphDriver {
  Name: string
  Data: Record<string, string>
}

/**
 * Image history item
 */
export interface ImageHistoryResponseItem {
  Id: string
  Created: number
  CreatedBy: string
  Tags: string[]
  Size: number
  Comment: string
}

/**
 * Image delete response item
 */
export interface ImageDeleteResponseItem {
  Untagged?: string
  Deleted?: string
}

/**
 * Images disk usage
 */
export interface ImagesDiskUsage {
  ActiveCount: number
  TotalCount: number
  Reclaimable: number
  TotalSize: number
  Items?: ImageSummary[]
}

/**
 * Image search result
 */
export interface ImageSearchResponseItem {
  description: string
  is_official: boolean
  is_automated: boolean
  name: string
  star_count: number
}

/**
 * Image prune response
 */
export interface ImagePruneResponse {
  ImagesDeleted?: ImageDeleteResponseItem[]
  SpaceReclaimed: number
}

/**
 * OCI descriptor
 */
export interface OCIDescriptor {
  mediaType: string
  digest: string
  size: number
  urls?: string[]
  annotations?: Record<string, string>
  data?: string
  platform?: OCIPlatform
  artifactType?: string
}

/**
 * OCI platform
 */
export interface OCIPlatform {
  architecture: string
  os: string
  "os.version"?: string
  "os.features"?: string[]
  variant?: string
}

/**
 * Image manifest summary
 */
export interface ImageManifestSummary {
  ID: string
  Descriptor: OCIDescriptor
  Available: boolean
  Size: {
    Total: number
    Content: number
  }
  Kind: "manifest" | "index" | "unknown"
  ImageData?: {
    Platform: OCIPlatform
    Identity?: Identity
    Containers?: string[]
    Size?: {
      Unpacked: number
    }
  }
  AttestationData?: {
    For: string
  }
}

/**
 * Identity information
 */
export interface Identity {
  Signature?: SignatureIdentity[]
  Pull?: PullIdentity[]
  Build?: BuildIdentity[]
}

/**
 * Build identity
 */
export interface BuildIdentity {
  Ref: string
  CreatedAt: string
}

/**
 * Pull identity
 */
export interface PullIdentity {
  Repository: string
}

/**
 * Signature identity
 */
export interface SignatureIdentity {
  Name: string
  Timestamps: SignatureTimestamp[]
  KnownSigner?: KnownSignerIdentity
  DockerReference?: string
  Signer?: SignerIdentity
  SignatureType?: SignatureType
  Error?: string
  Warnings?: string[]
}

/**
 * Signature timestamp
 */
export interface SignatureTimestamp {
  Type: SignatureTimestampType
  URI?: string
  Timestamp: string
}

/**
 * Signature timestamp type
 */
export type SignatureTimestampType = "sig" | "exp" | "att"

/**
 * Signature type
 */
export type SignatureType = "cosign" | "notation" | "sbom"

/**
 * Known signer identity
 */
export type KnownSignerIdentity = "docker-official" | "docker-notary-service"

/**
 * Signer identity
 */
export interface SignerIdentity {
  CertificateIssuer?: string
  SubjectAlternativeName?: string
  Issuer?: string
  BuildSignerURI?: string
  BuildSignerDigest?: string
  RunnerEnvironment?: string
  SourceRepositoryURI?: string
  SourceRepositoryDigest?: string
  SourceRepositoryRef?: string
  SourceRepositoryIdentifier?: string
  SourceRepositoryOwnerURI?: string
  SourceRepositoryOwnerIdentifier?: string
  BuildConfigURI?: string
  BuildConfigDigest?: string
  BuildTrigger?: string
  RunInvocationURI?: string
  SourceRepositoryVisibilityAtSigning?: string
}

/**
 * Image ID
 */
export interface ImageID {
  Id: string
}

/**
 * Create image information
 */
export interface CreateImageInfo {
  id?: string
  errorDetail?: ErrorDetail
  status?: string
  progressDetail?: ProgressDetail
}

/**
 * Push image information
 */
export interface PushImageInfo {
  errorDetail?: ErrorDetail
  status?: string
  progressDetail?: ProgressDetail
}

/**
 * Error detail
 */
export interface ErrorDetail {
  code?: number
  message: string
}

/**
 * Progress detail
 */
export interface ProgressDetail {
  current?: number
  total?: number
}

/**
 * Health configuration
 */
export interface HealthConfig {
  Test?: string[]
  Interval?: number
  Timeout?: number
  Retries?: number
  StartPeriod?: number
  StartInterval?: number
}

/**
 * Build cache disk usage
 */
export interface BuildCacheDiskUsage {
  ActiveCount: number
  TotalCount: number
  Reclaimable: number
  TotalSize: number
  Items?: BuildCache[]
}

/**
 * Build cache
 */
export interface BuildCache {
  ID: string
  Parents?: string[]
  Type: string
  Description?: string
  InUse?: boolean
  Shared?: boolean
  Size?: number
  CreatedAt: string
  LastUsedAt?: string
  UsageCount?: number
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * List images options
 */
export interface ListImagesOptions {
  all?: boolean
  filters?: {
    before?: string[]
    dangling?: string[]
    label?: string[]
    reference?: string[]
    since?: string[]
    until?: string[]
  }
  sharedSize?: boolean
  digests?: boolean
  manifests?: boolean
  identity?: boolean
}

/**
 * Pull image options
 */
export interface PullImageOptions {
  fromImage: string
  tag?: string
  platform?: string
  fromSrc?: string
  repo?: string
  message?: string
  inputImage?: BodyInit
  changes?: string[]
  authHeader?: string
}

/**
 * Push image options
 */
export interface PushImageOptions {
  tag?: string
  platform?: string
  authHeader: string
}

/**
 * Tag image options
 */
export interface TagImageOptions {
  repo: string
  tag?: string
}

/**
 * Remove image options
 */
export interface RemoveImageOptions {
  force?: boolean
  noprune?: boolean
  platforms?: string[]
}

/**
 * Search images options
 */
export interface SearchImagesOptions {
  term: string
  limit?: number
  filters?: {
    "is-official"?: string[]
    stars?: string[]
  }
}

/**
 * Prune images options
 */
export interface PruneImagesOptions {
  filters?: {
    dangling?: string[]
    until?: string[]
    label?: string[]
  }
}

/**
 * Inspect image options
 */
export interface InspectImageOptions {
  manifests?: boolean
  platform?: string
}

/**
 * History image options
 */
export interface HistoryImageOptions {
  platform?: string
}

/**
 * Export image options
 */
export interface ExportImageOptions {
  name: string
  platform?: string[]
}

/**
 * Export all images options
 */
export interface ExportAllImagesOptions {
  names?: string[]
  platform?: string[]
}

/**
 * Load image options
 */
export interface LoadImageOptions {
  imagesTarball: BodyInit
  quiet?: boolean
  platform?: string[]
}

/**
 * Build image options
 */
export interface BuildImageOptions {
  inputStream?: BodyInit
  dockerfile?: string
  t?: string
  extrahosts?: string
  remote?: string
  q?: boolean
  nocache?: boolean
  cachefrom?: string
  pull?: string
  rm?: boolean
  forcerm?: boolean
  memory?: number
  memswap?: number
  cpushares?: number
  cpusetcpus?: string
  cpuperiod?: number
  cpuquota?: number
  buildargs?: string
  shmsize?: number
  squash?: boolean
  labels?: string
  networkmode?: string
  authConfig?: string
  platform?: string
  target?: string
  outputs?: string
  version?: "1" | "2"
}

/**
 * Prune build cache options
 */
export interface PruneBuildCacheOptions {
  all?: boolean
  "keep-storage"?: number
  filters?: {
    until?: string
    id?: string[]
  }
}

/**
 *
 */
export interface CommitParams {
  container: string
  repo: string
  tag: string
  comment: string
  author: string
  pause: boolean
  changes: string
}
export interface CommitBody {
  /** The hostname to use for the container, as a valid RFC 1123 hostname. */
  Hostname: string
  /** The domain name to use for the container. */
  Domainname: string
  /**
   * Commands run as this user inside the container.
   * If omitted, commands run as the user
   * specified in the image the container was started from.
   *
   * Can be either user-name or UID, and optional group-name or GID,
   * separated by a colon (`<user-name|UID>[<:group-name|GID>]`).
   */
  User: string
  /**
   * Whether to attach to stdin.
   * Default: false
   */
  AttachStdin: boolean
  /**
   * Whether to attach to stdout.
   * Default: true
   */
  AttachStdout: boolean
  /**
   * Whether to attach to stderr.
   * Default: true
   */
  AttachStderr: boolean
  /**
   * An object mapping ports to an empty object in the form: {"<port>/<tcp|udp|sctp>": {}}
   */
  ExposedPorts: null | Record<string, unknown>
  /**
   * Attach standard streams to a TTY, including stdin if it is not closed.
   * Default: false
   */
  Tty: boolean
  /** Default: false */
  OpenStdin: boolean
  /**
   * Close stdin after one attached client disconnects
   * Default: false
   */
  StdinOnce: boolean
  /**
   * A list of environment variables to set inside the container
   * in the form ["VAR=value", ...].
   * A variable without = is removed from the environment,
   * rather than to have an empty value.
   */
  Env: string[]
  /** Command to run specified as a string or an array of strings. */
  Cmd: string | string[]
  /**
   * A test to perform to check that the container is healthy.
   * Healthcheck commands should be side-effect free.
   */
  HealthCheck: HealthCheck
  /**
   * Command is already escaped (Windows only)
   * Default: false
   * */
  ArgsEscaped: boolean | null
  /**
   * The name (or reference) of the image to use when creating the container,
   * or which was used when the container was created.
   */
  Image: string
  /**
   * An object mapping mount point paths inside the container to empty objects.
   */
  Volumes: Record<string, unknown>
  /**
   * The working directory for commands to run in.
   */
  WorkingDir: string
  /**
   * The entry point for the container as a string or an array of strings.
   * If the array consists of exactly one empty string ([""]),
   * then the entry point is reset to system default
   * (i.e., the entry point used by docker when there is no ENTRYPOINT instruction in the Dockerfile).
   */
  Entrypoint: string[]
  /**
   * Disable networking for the container.
   */
  NetworkDisabled: boolean | null
  /**
   * `ONBUILD` metadata that were defined in the image's Dockerfile.
   */
  OnBuild: string[] | null
  /**
   * User-defined key/value metadata.
   */
  Labels: Record<string, string>
  /**
   * Signal to stop a container as a string or unsigned integer.
   */
  StopSignal: string | number | null
  /**
   * Timeout to stop a container in seconds.
   * Default: 10
   */
  StopTimeout: number
  /**
   * Shell for when RUN, CMD, and ENTRYPOINT uses a shell.
   */
  Shell: string[]
}
