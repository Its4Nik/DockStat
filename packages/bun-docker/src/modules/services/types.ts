import type { HealthCheck, Resources } from "../../types"

export type ServiceFilters = {
  id: string[]
  label: string[]
  mode: ["replicated" | "global"]
  name: string[]
}

export type File = {
  Name: string
  UID: string
  GID: string
  Mode: number
}

export type ContainerSpec = {
  Image: string
  Labels: Record<string, string>
  Command: string[]
  Args: string[]
  Hostname: string
  Env: string[]
  Dir: string
  User: string
  Groups: string[]
  Privileges: {
    /**
     * CredentialSpec for managed service account (Windows only)
     */
    CredentialSpec: {
      /**
       * Load credential spec from a Swarm Config with the given ID. The specified config must also be present in the Configs field with the Runtime property set.
       */
      Config: string
      /**
       * Load credential spec from this file. The file is read by the daemon,
       * and must be present in the CredentialSpecs subdirectory in the docker data directory,
       * which defaults to C:\ProgramData\Docker\ on Windows.
       */
      File: string
      /**
       * Load credential spec from this value in the Windows registry.
       * The specified registry value must be located in: `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Virtualization\Containers\CredentialSpecs`
       */
      Registry: string
    }
    /**
     * SELinux labels of the container
     */
    SELinuxContext: {
      Disable: boolean
      User: string
      Role: string
      Type: string
      Level: string
    }
    /**
     * Options for configuring seccomp on the container
     */
    Seccomp: {
      Mode: "default" | "unconfined" | "custom"
      /**
       * The custom seccomp profile as a json object
       */
      Profile: string
    }
    AppArmor: {
      Mode: "default" | "disabled"
    }
    /**
     * Configuration of the no_new_privs bit in the container
     */
    NoNewPrivileges: boolean
  }
  TTY: boolean
  OpenStdin: boolean
  ReadOnly: boolean
  Mounts: Array<{
    /** Container path */
    Target: string
    /**
     * Mount source (e.g. a volume name, a host path).
     * The source cannot be specified when using `Type=tmpfs`.
     * For `Type=bind`, the source path must either exist,
     * or the CreateMountpoint must be set to true to create the source path on the host if missing.
     * For `Type=npipe`, the pipe must exist prior to creating the container.
     */
    Source: string
    /**
     * The mount type. Available types:
     * - bind Mounts a file or directory from the host into the container. The Source must exist prior to creating the container.
     * - cluster a Swarm cluster volume
     * - image Mounts an image.
     * - npipe Mounts a named pipe from the host into the container. The Source must exist prior to creating the container.
     * - tmpfs Create a tmpfs with the given options. The mount Source cannot be specified for tmpfs.
     * - volume Creates a volume with the given name and options (or uses a pre-existing volume with the same name and options). These are not removed when the container is removed.
     */
    Type: "bind" | "cluster" | "image" | "npipe" | "tmpfs" | "volume"
    ReadOnly: boolean
    Consistency: "default" | "consistent" | "cached" | "delegated"
    /** Optional configuration for the bind type. */
    BindOptions: {
      /** A propagation mode with the value `[r]private`, `[r]shared`, or `[r]slave`. */
      Propagation: "private" | "rprivate" | "shared" | "rshared" | "slave" | "rslave"
      /** Disable recursive bind mount. Default: `false` */
      NonRecursive: boolean
      /** Create mount point on host if missing. Default: `false` */
      CreateMountpoint: boolean
      /** Make the mount non-recursively read-only,
       * but still leave the mount recursive (unless NonRecursive is set to true in conjunction).
       * Added in v1.44, before that version all read-only mounts were non-recursive by default.
       * To match the previous behaviour this will default to true for clients on versions prior to v1.44.
       * Default: false
       */
      ReadOnlyNonRecursive: boolean
      /**
       * Raise an error if the mount cannot be made recursively read-only.
       * Default: false
       */
      ReadOnlyForceRecursive: boolean
    }
    VolumeOptions: {
      /**
       * Populate volume with data from the target.
       * Default: false
       */
      NoCopy: boolean
      Labels: Record<string, string>
      DriverConfig: {
        Name: string,
        Options: Record<string, string>
      }
        /** Source path inside the volume. Must be relative without any back traversals. */
        Subpath: string
    }
    ImageOptions: {
      /** Source path inside the image. Must be relative without any back traversals. */
      Subpath: string
    }
    TmpfsOptions: {
      SizeBytes: number
      /**
       * The permission mode for the tmpfs mount in an integer.
       * The value must not be in octal format (e.g. 755) but rather the decimal representation of the octal value (e.g. 493).
       */
      Mode: number
      /**
       * The options to be passed to the tmpfs mount.
       * An array of arrays. Flag options should be provided as 1-length arrays.
       * Other types should be provided as as 2-length arrays, where the first item is the key and the second the value.
       */
      Options: string[]
    }
  }>
  StopSignal: number
  StopGracePeriod: number
  HealthCheck: HealthCheck
  /**
   * A list of hostname/IP mappings to add to the container's hosts file.
   * The format of extra hosts is specified in the hosts(5) man page:
   * ```
   * IP_address canonical_hostname [aliases...]
   * ```
   */
  Hosts: string[]
  /**
   * Specification for DNS related configurations in resolver configuration file (resolv.conf).
   */
  DNSConfig: {
    Nameservers: string[]
    Search: string[]
    /**
     * A list of internal resolver variables to be modified (e.g., debug, ndots:3, etc.).
     */
    Options: string[]
  }
  Secrets: Array<
    {
      File: File
      /**
       * SecretID represents the ID of the specific secret that we're referencing
       */
      SecretID: string
      /**
       * SecretName is the name of the secret that this references,
       * but this is just provided for lookup/display purposes.
       * The secret in the reference will be identified by its ID.
       */
      SecretName: string
    }
  >
  /**
   * An integer value containing the score given to the container in order to tune OOM killer preferences.
   */
  OomScoreAdj: number
  Configs: Array<{
    File: File
    /**
     * Runtime represents a target that is not mounted into the container but is used by the task
     */
    Runtime: object // I couldnt find any docs on it's typing :(
    /**
     * ConfigID represents the ID of the specific config that we're referencing.
     */
    ConfigID: string
    /**
     * ConfigName is the name of the config that this references, but this is just provided for lookup/display purposes. The config in the reference will be identified by its ID.
     */
    ConfigName: string
  }>
  /** Isolation technology of the containers running the service. (Windows only) */
  Isolation: "default" | "process" | "hyperv" | ""
  /**
   * Run an init inside the container that forwards signals and reaps processes.
   * This field is omitted if empty, and the default (as configured on the daemon) is used.
   */
  Init: boolean | null
  /**
   * Set kernel namedspaced parameters (sysctls) in the container.
   * The Sysctls option on services accepts the same sysctls as the are supported on containers.
   * Note that while the same sysctls are supported,
   * no guarantees or checks are made about their suitability for a clustered environment,
   * and it's up to the user to determine whether a given sysctl will work properly in a Service.
   */
  Sysctls: Record<string, string>
  /** A list of kernel capabilities to add to the default set for the container. */
  CapabilityAdd: string[]
  /** A list of kernel capabilities to drop from the default set for the container. */
  CapabilityDrop: string[]
  ULimits: Array<{Name: string, Soft: number,Hard: number}>
}

export type ServiceDefinition = {
  ID: string,
  Version: {
    Index: number
  }
  CreatedAt: string
  UpdatedAt: string
  Spec: {
    Name: string
    Labels: Record<string, string>
    TaskTemplate: {
      /**
       * Plugin spec for the service. (Experimental release only.)
       *
       * Note: ContainerSpec, NetworkAttachmentSpec, and PluginSpec are mutually exclusive.
       * PluginSpec is only used when the Runtime field is set to plugin.
       * NetworkAttachmentSpec is used when the Runtime field is set to attachment.
       */
      PluginSpec: {
        Name: string
        Remote: string
        Disabled: boolean
        PluginPrivilege: Array<{
          Name: string, Description: string, Value: string[]
        }>
      }
      /**
       * Container spec for the service.
       * Note: ContainerSpec, NetworkAttachmentSpec, and PluginSpec are mutually exclusive.
       * PluginSpec is only used when the Runtime field is set to plugin.
       * NetworkAttachmentSpec is used when the Runtime field is set to attachment.
       */
      ContainerSpec: ContainerSpec
      /**
       * Read-only spec type for non-swarm containers attached to swarm overlay networks.
       */
      NetworkAttachmentSpec: {
        ContainerID: string
      }
      Resources: {
        Limits: {
          NanoCPUs: number
          MemoryBytes: number
          /**
           * Limits the maximum number of PIDs in the container. Set 0 for unlimited.
           * Default: 0
           */
          Pids: number
        }
        Reservations: {
          NanoCPUs: number
          MemoryBytes: number
          GenericResources: Resources
        }
        /**
         * Amount of swap in bytes - can only be used together with a memory limit.
         * If not specified, the default behaviour is to grant a swap space twice as big as the memory limit.
         * Set to -1 to enable unlimited swap.
         */
        SwapBytes: number | null
        /**
         * Tune the service's containers' memory swappiness (0 to 100).
         * If not specified, defaults to the containers' OS' default,
         * generally 60, or whatever value was predefined in the image.
         * Set to -1 to unset a previously set value.
         */
        MemorySwappiness: number | null
      }
      RestartPolicy: {
        Condition: "none" | "on-failure" | "any"
        Delay: number
        /**
         * Maximum attempts to restart a given container before giving up (default value is 0, which is ignored).
         * Default: 0
         */
        MaxAttemps: number
        /**
         * Windows is the time window used to evaluate the restart policy (default value is 0, which is unbounded).
         * Default: 0
         */
        Window: number
      }
      Placement: {
        /**
         * An array of constraint expressions to limit the set of nodes where a task can be scheduled.
         *
         * Constraint expressions can either use a match (`==`) or exclude (`!=`) rule.
         * Multiple constraints find nodes that satisfy every expression (AND match).
         *
         * **Available Node Attributes:**
         * - `node.id`: Matches the Node ID.
         * - `node.hostname`: Matches the Node hostname.
         * - `node.role`: Matches the Node role (manager/worker).
         * - `node.platform.os`: Matches the Node operating system.
         * - `node.platform.arch`: Matches the Node architecture.
         * - `node.labels`: Matches user-defined node labels.
         * - `engine.labels`: Matches Docker Engine labels (e.g., OS, drivers).
         *
         * @example <caption>Match a specific node ID</caption>
         * node.id==2ivku8v2gvtg4
         *
         * @example <caption>Exclude a specific hostname</caption>
         * node.hostname!=node-2
         *
         * @example <caption>Match a manager node</caption>
         * node.role==manager
         *
         * @example <caption>Match operating system</caption>
         * node.platform.os==windows
         *
         * @example <caption>Match user-defined label</caption>
         * node.labels.security==high
         *
         * @example <caption>Match engine label</caption>
         * engine.labels.operatingsystem==ubuntu-24.04
         *
         * @note `engine.labels` apply to Docker Engine labels like operating system, drivers, etc.
         * Swarm administrators add `node.labels` for operational purposes via the node update endpoint.
         */
        Constraints: string[];
        Preferences: Array<{
          Spread: {
          SpreadDescriptor: string
          }
        }>
        /**
         * Maximum number of replicas for per node
         * (default value is 0, which is unlimited)
         */
        MaxReplicas: number
        Platform: Array<{
          Architecture: string
          OS: string
        }>
      }
      /**
       * A counter that triggers an update even if no relevant parameters have been changed.
       */
      ForceUpdate: number
      Runtime: string
      Networks: Array<{
        /**
         * The target network for attachment. Must be a network name or ID.
         */
        Target: string
        /**
         * Discoverable alternate names for the service on this network.
         */
        Aliases: string[]
        /**
         * Driver attachment options for the network target.
         */
        DriverOpts: Record<string, string>
      }>
      LogDriver: {
        Name: string
        Options: Record<string,string>
      }
    }
    Mode: {
      Replicated: {
        Replicas: number
      }
      /**
       * No official Docker docs => generic object type
       */
      Global: object
      /**
       * The mode used for services with a finite number of tasks that run to a completed state.
       */
      ReplicatedJob: {
        /**
         * The maximum number of replicas to run simultaneously.
         * Default: 1
         */
        MaxConcurrent: number
        /**
         * The total number of replicas desired to reach the Completed state.
         * If unset, will default to the value of MaxConcurrent
         */
        TotalCompletions:number
      }
      /**
       * The mode used for services which run a task to the completed state on each valid node.
       * No official Docker docs => generic object type
       */
      GlobalJob: object
    }
    UpdateConfig: {
      /**
       * Maximum number of tasks to be updated in one iteration (0 means unlimited parallelism).
       */
      Parallelism: number
      /**
       * Amount of time between updates, in nanoseconds.
       */
      Delay: number
      FailureAction: "continue" | "pause" | "rollback"
    }
  }
}
