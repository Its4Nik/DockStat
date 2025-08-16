export interface Stack {
  compose_spec: ComposeSpec;
  name: string;
  version: number;
  source: string;
  id?: number;
}

export interface ComposeSpec {
  version?: string;
  name?: string;
  include?: Include[];
  services?: { [key: string]: Service };
  networks?: { [key: string]: Network };
  volumes?: { [key: string]: Volume };
  secrets?: { [key: string]: Secret };
  configs?: { [key: string]: Config };

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

type Include =
  | string
  | {
      path: string | string[];
      env_file?: string | string[];
      project_directory?: string;
    };

interface Service {
  develop?: Development | null;
  deploy?: Deployment | null;
  annotations?: ListOrDict;
  attach?: boolean | string;
  build?:
    | string
    | {
        context?: string;
        dockerfile?: string;
        dockerfile_inline?: string;
        entitlements?: string[];
        args?: ListOrDict;
        ssh?: ListOrDict;
        labels?: ListOrDict;
        cache_from?: string[];
        cache_to?: string[];
        no_cache?: boolean | string;
        additional_contexts?: ListOrDict;
        network?: string;
        pull?: boolean | string;
        target?: string;
        shm_size?: number | string;
        extra_hosts?: ExtraHosts;
        isolation?: string;
        privileged?: boolean | string;
        secrets?: ServiceConfigOrSecret[];
        tags?: string[];
        ulimits?: Ulimits;
        platforms?: string[];

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      };
  blkio_config?: {
    device_read_bps?: BlkioLimit[];
    device_read_iops?: BlkioLimit[];
    device_write_bps?: BlkioLimit[];
    device_write_iops?: BlkioLimit[];
    weight?: number | string;
    weight_device?: BlkioWeight[];
  };
  cap_add?: string[];
  cap_drop?: string[];
  cgroup?: "host" | "private";
  cgroup_parent?: string;
  command?: Command;
  configs?: ServiceConfigOrSecret[];
  container_name?: string;
  cpu_count?: string | number;
  cpu_percent?: string | number;
  cpu_shares?: number | string;
  cpu_quota?: number | string;
  cpu_period?: number | string;
  cpu_rt_period?: number | string;
  cpu_rt_runtime?: number | string;
  cpus?: number | string;
  cpuset?: string;
  credential_spec?: {
    config?: string;
    file?: string;
    registry?: string;

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };
  depends_on?:
    | string[]
    | {
        [service: string]: {
          condition:
            | "service_started"
            | "service_healthy"
            | "service_completed_successfully";
          restart?: boolean | string;
          required?: boolean;

          //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
          [key: `x-${string}`]: any;
        };
      };
  device_cgroup_rules?: string[];
  devices?: (
    | string
    | {
        source: string;
        target?: string;
        permissions?: string;

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      }
  )[];
  dns?: StringOrList;
  dns_opt?: string[];
  dns_search?: StringOrList;
  domainname?: string;
  entrypoint?: Command;
  env_file?: EnvFile;
  label_file?: string | string[];
  environment?: ListOrDict;
  expose?: (string | number)[];
  extends?: string | { service: string; file?: string };
  external_links?: string[];
  extra_hosts?: ExtraHosts;
  gpus?:
    | "all"
    | Array<{
        capabilities?: string[];
        count?: string | number;
        device_ids?: string[];
        driver?: string;
        options?: ListOrDict;

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      }>;
  group_add?: (string | number)[];
  healthcheck?: Healthcheck;
  hostname?: string;
  image?: string;
  init?: boolean | string;
  ipc?: string;
  isolation?: string;
  labels?: ListOrDict;
  links?: string[];
  logging?: {
    driver?: string;
    options?: { [key: string]: string | number | null };

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };
  mac_address?: string;
  mem_limit?: number | string;
  mem_reservation?: string | number;
  mem_swappiness?: number | string;
  memswap_limit?: number | string;
  network_mode?: string;
  networks?:
    | string[]
    | {
        [network: string]: {
          aliases?: string[];
          ipv4_address?: string;
          ipv6_address?: string;
          link_local_ips?: string[];
          mac_address?: string;
          driver_opts?: { [key: string]: string | number };
          priority?: number;

          //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
          [key: `x-${string}`]: any;
        } | null;
      };
  oom_kill_disable?: boolean | string;
  oom_score_adj?: string | number;
  pid?: string | null;
  pids_limit?: number | string;
  platform?: string;
  ports?: (
    | number
    | string
    | {
        name?: string;
        mode?: string;
        host_ip?: string;
        target?: number | string;
        published?: string | number;
        protocol?: string;
        app_protocol?: string;

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      }
  )[];
  post_start?: ServiceHook[];
  pre_stop?: ServiceHook[];
  privileged?: boolean | string;
  profiles?: string[];
  pull_policy?: "always" | "never" | "if_not_present" | "build" | "missing";
  read_only?: boolean | string;
  restart?: string;
  runtime?: string;
  scale?: number | string;
  security_opt?: string[];
  shm_size?: number | string;
  secrets?: ServiceConfigOrSecret[];
  sysctls?: ListOrDict;
  stdin_open?: boolean | string;
  stop_grace_period?: string;
  stop_signal?: string;
  storage_opt?: object;
  tmpfs?: StringOrList;
  tty?: boolean | string;
  ulimits?: Ulimits;
  user?: string;
  uts?: string;
  userns_mode?: string;
  volumes?: (
    | string
    | {
        type: string;
        source?: string;
        target?: string;
        read_only?: boolean | string;
        consistency?: string;
        bind?: {
          propagation?: string;
          create_host_path?: boolean | string;
          recursive?: "enabled" | "disabled" | "writable" | "readonly";
          selinux?: "z" | "Z";

          //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
          [key: `x-${string}`]: any;
        };
        volume?: {
          nocopy?: boolean | string;
          subpath?: string;

          //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
          [key: `x-${string}`]: any;
        };
        tmpfs?: {
          size?: number | string;
          mode?: number | string;

          //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
          [key: `x-${string}`]: any;
        };

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      }
  )[];
  volumes_from?: string[];
  working_dir?: string;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Healthcheck {
  disable?: boolean | string;
  interval?: string;
  retries?: number | string;
  test?: string | string[];
  timeout?: string;
  start_period?: string;
  start_interval?: string;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Development {
  watch?: Array<{
    path: string;
    action: "rebuild" | "sync" | "restart" | "sync+restart" | "sync+exec";
    ignore?: string[];
    target?: string;
    exec?: ServiceHook;

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  }>;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Deployment {
  mode?: string;
  endpoint_mode?: string;
  replicas?: number | string;
  labels?: ListOrDict;
  rollback_config?: {
    parallelism?: number | string;
    delay?: string;
    failure_action?: string;
    monitor?: string;
    max_failure_ratio?: number | string;
    order?: "start-first" | "stop-first";

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };
  update_config?: {
    parallelism?: number | string;
    delay?: string;
    failure_action?: string;
    monitor?: string;
    max_failure_ratio?: number | string;
    order?: "start-first" | "stop-first";

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };
  resources?: {
    limits?: {
      cpus?: number | string;
      memory?: string;
      pids?: number | string;

      //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
      [key: `x-${string}`]: any;
    };
    reservations?: {
      cpus?: number | string;
      memory?: string;
      generic_resources?: Array<{
        discrete_resource_spec?: {
          kind?: string;
          value?: number | string;

          //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
          [key: `x-${string}`]: any;
        };

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      }>;
      devices?: Array<{
        capabilities?: string[];
        count?: string | number;
        device_ids?: string[];
        driver?: string;
        options?: ListOrDict;

        //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
        [key: `x-${string}`]: any;
      }>;

      //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
      [key: `x-${string}`]: any;
    };

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };
  restart_policy?: {
    condition?: string;
    delay?: string;
    max_attempts?: number | string;
    window?: string;

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };
  placement?: {
    constraints?: string[];
    preferences?: Array<{
      spread?: string;

      //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
      [key: `x-${string}`]: any;
    }>;
    max_replicas_per_node?: number | string;

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

type Command = string | string[] | null;
type EnvFile =
  | string
  | Array<
      string | { path: string; format?: string; required?: boolean | string }
    >;
type StringOrList = string | string[];
type ListOrDict =
  | { [key: string]: string | number | boolean | null }
  | string[];
type ExtraHosts = { [host: string]: string | string[] } | string[];
interface BlkioLimit {
  path: string;
  rate: number | string;
}
interface BlkioWeight {
  path: string;
  weight: number | string;
}
type ServiceConfigOrSecret =
  | string
  | {
      source: string;
      target?: string;
      uid?: string;
      gid?: string;
      mode?: number | string;

      //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
      [key: `x-${string}`]: any;
    };
type Ulimits = {
  [key: string]:
    | number
    | string
    | { hard: number | string; soft: number | string };
};

interface ServiceHook {
  command?: Command;
  user?: string;
  privileged?: boolean | string;
  working_dir?: string;
  environment?: ListOrDict;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Network {
  name?: string;
  driver?: string;
  driver_opts?: { [key: string]: string | number };
  ipam?: {
    driver?: string;
    config?: Array<{
      subnet?: string;
      ip_range?: string;
      gateway?: string;
      aux_addresses?: { [key: string]: string };

      //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
      [key: `x-${string}`]: any;
    }>;
    options?: { [key: string]: string };

    //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
    [key: `x-${string}`]: any;
  };

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  external?: boolean | string | { name?: string; [key: `x-${string}`]: any };
  internal?: boolean | string;
  enable_ipv4?: boolean | string;
  enable_ipv6?: boolean | string;
  attachable?: boolean | string;
  labels?: ListOrDict;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Volume {
  name?: string;
  driver?: string;
  driver_opts?: { [key: string]: string | number };

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  external?: boolean | string | { name?: string; [key: `x-${string}`]: any };
  labels?: ListOrDict;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Secret {
  name?: string;
  environment?: string;
  file?: string;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  external?: boolean | string | { name?: string; [key: string]: any };
  labels?: ListOrDict;
  driver?: string;
  driver_opts?: { [key: string]: string | number };
  template_driver?: string;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}

interface Config {
  name?: string;
  content?: string;
  environment?: string;
  file?: string;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  external?: boolean | string | { name?: string; [key: string]: any };
  labels?: ListOrDict;
  template_driver?: string;

  //biome-ignore lint/suspicious/noExplicitAny: Compose Spec
  [key: `x-${string}`]: any;
}
