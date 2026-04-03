import { Docker } from "./docker";
import { getConnectionConfig } from "./utils/env";

export const createDockerFromEnv = () => {
  const config = getConnectionConfig();
  return new Docker(config);
};

export { Docker };
export type { ImagesModule } from "./modules/images";



const t = new Docker({mode: "unix", socketPath: "/var/run/docker.sock"})

console.log((await t.images.list()))
