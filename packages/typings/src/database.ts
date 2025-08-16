import type { THEME_config } from "./themes";

type DB_target_host = {
  host: string; // IP or DNS
  secure: boolean; // SSL yes or no
  name: string;
  id: number;
};

type DB_config = {
  fetch_interval: number;
  target_hosts: DB_target_host[];
  theme_config: THEME_config;
};

export type { DB_config, DB_target_host };
