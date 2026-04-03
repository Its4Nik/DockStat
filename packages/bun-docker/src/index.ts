import { Docker } from "./docker";
import { getConnectionConfig } from "./utils/env";

export const createDockerFromEnv = () => {
  const config = getConnectionConfig();
  return new Docker(config);
};

export { Docker };
