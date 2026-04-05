import { env } from "node:process"
import type { ConnectionConfig } from "../modules/base/types"

const loadTls = () => {
  // biome-ignore lint: Needed for dts-bundle-generator
  const hasCerts = env["CERT_FILE"] && env["KEY_FILE"]
  if (!hasCerts) return undefined

  return {
    // biome-ignore lint: Needed for dts-bundle-generator
    ca: env["CA_FILE"] ? Bun.file(env["CA_FILE"]) : undefined,
    // biome-ignore lint: Needed for dts-bundle-generator
    cert: env["CERT_FILE"] ? Bun.file(env["CERT_FILE"]) : undefined,
    // biome-ignore lint: Needed for dts-bundle-generator
    key: env["KEY_FILE"] ? Bun.file(env["KEY_FILE"]) : undefined,
  }
}

export const getConnectionConfig = (): ConnectionConfig => {
  // biome-ignore lint: Needed for dts-bundle-generator
  const rawHost = env["DOCKER_SOCKET"] || "/var/run/docker.sock"
  const tls = loadTls()

  if (rawHost.startsWith("unix://")) {
    return {
      mode: "unix",
      socketPath: rawHost.replace("unix://", ""),
      tls,
    }
  }

  if (rawHost.startsWith("tcp://") || rawHost.startsWith("http://")) {
    let protocol = "http://"

    if (tls) {
      protocol = "https://"
    }

    const cleanHost = rawHost.replace(/^tcp:\/\/|^http:\/\//, "")

    return {
      mode: "tcp",
      baseUrl: `${protocol}${cleanHost}`,
      tls,
    }
  }

  return {
    mode: "unix",
    socketPath: rawHost,
    tls,
  }
}
