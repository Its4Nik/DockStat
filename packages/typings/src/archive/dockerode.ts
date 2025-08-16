interface DockerInfo {
	ID: string;
	Containers: number;
	ContainersRunning: number;
	ContainersPaused: number;
	ContainersStopped: number;
	Images: number;
	Driver: string;
	DriverStatus: [string, string][];
	DockerRootDir: string;
	SystemStatus: [string, string][];
	Plugins: {
		Volume: string[];
		Network: string[];
		Authorization: string[];
		Log: string[];
	};
	MemoryLimit: boolean;
	SwapLimit: boolean;
	KernelMemory: boolean;
	CpuCfsPeriod: boolean;
	CpuCfsQuota: boolean;
	CPUShares: boolean;
	CPUSet: boolean;
	OomKillDisable: boolean;
	IPv4Forwarding: boolean;
	BridgeNfIptables: boolean;
	BridgeNfIp6tables: boolean;
	Debug: boolean;
	NFd: number;
	NGoroutines: number;
	SystemTime: string;
	LoggingDriver: string;
	CgroupDriver: string;
	NEventsListener: number;
	KernelVersion: string;
	OperatingSystem: string;
	OSType: string;
	Architecture: string;
	NCPU: number;
	MemTotal: number;
	IndexServerAddress: string;
	RegistryConfig: {
		AllowNondistributableArtifactsCIDRs: string[];
		AllowNondistributableArtifactsHostnames: string[];
		InsecureRegistryCIDRs: string[];
		IndexConfigs: Record<
			string,
			{
				Name: string;
				Mirrors: string[];
				Secure: boolean;
				Official: boolean;
			}
		>;
		Mirrors: string[];
	};
	GenericResources: Array<
		| { DiscreteResourceSpec: { Kind: string; Value: number } }
		| { NamedResourceSpec: { Kind: string; Value: string } }
	>;
	HttpProxy: string;
	HttpsProxy: string;
	NoProxy: string;
	Name: string;
	Labels: string[];
	ExperimentalBuild: boolean;
	ServerVersion: string;
	ClusterStore: string;
	ClusterAdvertise: string;
	Runtimes: Record<
		string,
		{
			path: string;
			runtimeArgs?: string[];
		}
	>;
	DefaultRuntime: string;
	Swarm: {
		NodeID: string;
		NodeAddr: string;
		LocalNodeState: string;
		ControlAvailable: boolean;
		Error: string;
		RemoteManagers: Array<{
			NodeID: string;
			Addr: string;
		}>;
		Nodes: number;
		Managers: number;
		Cluster: {
			ID: string;
			Version: {
				Index: number;
			};
			CreatedAt: string;
			UpdatedAt: string;
			Spec: {
				Name: string;
				Labels: Record<string, string>;
				Orchestration: {
					TaskHistoryRetentionLimit: number;
				};
				Raft: {
					SnapshotInterval: number;
					KeepOldSnapshots: number;
					LogEntriesForSlowFollowers: number;
					ElectionTick: number;
					HeartbeatTick: number;
				};
				Dispatcher: {
					HeartbeatPeriod: number;
				};
				CAConfig: {
					NodeCertExpiry: number;
					ExternalCAs: Array<{
						Protocol: string;
						URL: string;
						Options: Record<string, string>;
						CACert: string;
					}>;
					SigningCACert: string;
					SigningCAKey: string;
					ForceRotate: number;
				};
				EncryptionConfig: {
					AutoLockManagers: boolean;
				};
				TaskDefaults: {
					LogDriver: {
						Name: string;
						Options: Record<string, string>;
					};
				};
			};
			TLSInfo: {
				TrustRoot: string;
				CertIssuerSubject: string;
				CertIssuerPublicKey: string;
			};
			RootRotationInProgress: boolean;
		};
	};
	LiveRestoreEnabled: boolean;
	Isolation: string;
	InitBinary: string;
	ContainerdCommit: {
		ID: string;
		Expected: string;
	};
	RuncCommit: {
		ID: string;
		Expected: string;
	};
	InitCommit: {
		ID: string;
		Expected: string;
	};
	SecurityOptions: string[];
}

export type { DockerInfo };
