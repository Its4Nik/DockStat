declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Docker daemon connection URL (preferred). Supports `unix://`, `tcp://`, `http://` formats. */
      DOCKER_HOST?: string
      /** Docker daemon socket path (legacy). Same format support as `DOCKER_HOST`. */
      DOCKER_SOCKET?: "/var/run/docker.sock" | string
      /** Request timeout in milliseconds for Docker API calls. */
      DOCKER_TIMEOUT?: string
      /** Docker Engine API version (e.g., `"1.54"`). */
      DOCKER_API_VERSION?: string
      /** Log level for the Docker client logger (`debug`, `info`, `warn`, `error`). */
      DOCKER_CLIENT_LOG_LEVEL?: "debug" | "info" | "warn" | "error"
      /** Path to the TLS CA certificate file. */
      CA_FILE?: string
      /** Path to the TLS client certificate file. */
      CERT_FILE?: "./cert.pem" | string
      /** Path to the TLS client key file. */
      KEY_FILE?: "./key.pem" | string
      /** Whether to enable the API. */
      ENABLE_API?: string
      /** Comma-separated list of API keys. */
      API_KEYS?: string
      /** Port for the API server. */
      API_PORT?: string
    }
  }
}

export {}
