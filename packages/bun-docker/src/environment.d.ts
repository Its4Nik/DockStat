declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DOCKER_SOCKET: "/var/run/docker.sock" | string
      ENABLE_API?: string
      API_KEYS?: string
      API_PORT?: string
      KEY_FILE?: "./key.pem"
      CERT_FILE?: "./cert.pem"
      CA_FILE?: "./ca.pem"
    }
  }
}

export {}
