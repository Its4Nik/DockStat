import type { TLSOptions } from "bun";

export type ConnectionMode = 'unix' | 'tcp';

export interface ConnectionConfig {
  mode: ConnectionMode;
  // For Unix: the file path
  socketPath?: string;
  // For TCP: the full base URL (e.g., http://192.168.1.50:2375)
  baseUrl?: string;
  // TLS options (used for TCP or TLS-secured Unix sockets)
  tls?: TLSOptions;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
