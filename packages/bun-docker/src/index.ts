import { Docker } from "./docker"
import { getConnectionConfig } from "./utils/env"
import { DockerError } from "./utils/error"

export const createDockerFromEnv = () => {
  const config = getConnectionConfig()
  return new Docker(config)
}

export { Docker,DockerError }
