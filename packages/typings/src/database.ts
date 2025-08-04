//import { ComposeSpec } from "./docker-compose";

type Theme = {
  name: string;
  creator: string;
  options: ThemeOptions;
  tags: string[];
  vars: string;
};

interface config {
  keep_data_for: number;
  fetching_interval: number;
}

export type ThemeOptions = {
  backgroundAnimation: {
    enabled: boolean;
    from: string[];
    amplitude: number;
    blend: number;
    speed: number;
  };
};

interface stacks_config {
  id: number;
  name: string;
  version: number;
  custom: boolean;
  source: string;
  compose_spec: string;
}

interface log_message {
  level: string;
  timestamp: string;
  message: string;
  file: string;
  line: number;
}

interface container_stats {
  id: string;
  hostId: number;
  name: string;
  image: string;
  status: string;
  state: string;
  cpu_usage: number;
  memory_usage: number;
  network_rx_rate: number;
  network_tx_rate: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  timestamp?: string;
}

export type { Theme, container_stats, config, stacks_config, log_message };
