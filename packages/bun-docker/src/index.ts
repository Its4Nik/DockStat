import { Docker } from "./docker"
import { getConnectionConfig } from "./utils/env"

export const createDockerFromEnv = () => {
  const config = getConnectionConfig()
  return new Docker(config)
}

export { Docker }

const t = new Docker({ mode: "unix", socketPath: "/var/run/docker.sock" })

t.containers.export("BENIS").then((res) => console.log(res))
