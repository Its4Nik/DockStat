/**
 * Volume information
 */
export interface Volume {
  Name: string;
  Driver: string;
  Mountpoint: string;
  CreatedAt?: string;
  Status?: Record<string, any>;
  Labels: Record<string, string>;
  Scope: "local" | "global";
  ClusterVolume?: ClusterVolume;
  Options?: Record<string, string>;
  UsageData?: VolumeUsageData;
}

/**
 * Volume usage data
 */
export interface VolumeUsageData {
  Size: number;
  RefCount: number;
}

/**
 * Volumes disk usage information
 */
export interface VolumesDiskUsage {
  ActiveCount: number;
  TotalCount: number;
  Reclaimable: number;
  TotalSize: number;
  Items?: Volume[];
}

/**
 * Volume create request
 */
export interface VolumeCreateRequest {
  Name?: string;
  Driver?: string;
  DriverOpts?: Record<string, string>;
  Labels?: Record<string, string>;
  ClusterVolumeSpec?: ClusterVolumeSpec;
}

/**
 * Volume list response
 */
export interface VolumeListResponse {
  Volumes: Volume[];
  Warnings?: string[];
}

/**
 * Volume prune response
 */
export interface VolumePruneResponse {
  VolumesDeleted?: string[];
  SpaceReclaimed: number;
}

/**
 * Cluster volume information (Swarm CSI cluster volumes)
 */
export interface ClusterVolume {
  ID?: string;
  Version?: ObjectVersion;
  CreatedAt?: string;
  UpdatedAt?: string;
  Spec?: ClusterVolumeSpec;
  Info?: ClusterVolumeInfo;
  PublishStatus?: ClusterVolumePublishStatus[];
}

/**
 * Object version
 */
export interface ObjectVersion {
  Index: number;
}

/**
 * Cluster volume spec
 */
export interface ClusterVolumeSpec {
  Group?: string;
  AccessMode?: ClusterVolumeAccessMode;
  Secrets?: ClusterVolumeSecret[];
  AccessibilityRequirements?: ClusterVolumeAccessibilityRequirements;
  CapacityRange?: ClusterVolumeCapacityRange;
  Availability?: "active" | "pause" | "drain";
}

/**
 * Cluster volume access mode
 */
export interface ClusterVolumeAccessMode {
  Scope: "single" | "multi";
  Sharing: "none" | "readonly" | "onewriter" | "all";
  MountVolume?: ClusterVolumeMountVolume;
  BlockVolume?: ClusterVolumeBlockVolume;
}

/**
 * Cluster volume mount volume options
 */
export interface ClusterVolumeMountVolume {
  FsType?: string;
  MountFlags?: string[];
}

/**
 * Cluster volume block volume options
 */
export interface ClusterVolumeBlockVolume {
  [key: string]: any;
}

/**
 * Cluster volume secret
 */
export interface ClusterVolumeSecret {
  Key: string;
  Secret: string;
}

/**
 * Cluster volume accessibility requirements
 */
export interface ClusterVolumeAccessibilityRequirements {
  Requisite?: Topology[];
  Preferred?: Topology[];
}

/**
 * Cluster volume capacity range
 */
export interface ClusterVolumeCapacityRange {
  RequiredBytes?: number;
  LimitBytes?: number;
}

/**
 * Cluster volume info
 */
export interface ClusterVolumeInfo {
  CapacityBytes?: number;
  VolumeContext?: Record<string, string>;
  VolumeID?: string;
  AccessibleTopology?: Topology[];
}

/**
 * Cluster volume publish status
 */
export interface ClusterVolumePublishStatus {
  NodeID: string;
  State: "pending-publish" | "published" | "pending-node-unpublish" | "pending-controller-unpublish";
  PublishContext?: Record<string, string>;
}

/**
 * Topology information
 */
export interface Topology {
  [key: string]: string;
}

/**
 * List volumes options
 */
export interface ListVolumesOptions {
  filters?: {
    dangling?: boolean[];
    driver?: string[];
    label?: string[];
    name?: string[];
  };
}

/**
 * Prune volumes options
 */
export interface PruneVolumesOptions {
  filters?: {
    label?: string[];
    all?: boolean[];
  };
}

/**
 * Volume update request (for cluster volumes)
 */
export interface VolumeUpdateRequest {
  Spec: ClusterVolumeSpec;
}
