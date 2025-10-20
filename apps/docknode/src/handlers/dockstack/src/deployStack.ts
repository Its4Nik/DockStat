import { dockStackLogger } from "..";

export const STACK_DIR = "./stacks" as const;

export async function writeDockerCompose(
  stackId: number,
  stackName: string,
  vars: Record<string, string>,
  compose: string
) {
  try {
    dockStackLogger.info(`Writing Docker Compose of ${stackName}`);
    const stackDir = getStackDir(stackId, stackName);

    const YamlDump = Bun.YAML.parse(parseVars(vars, compose)) as string;

    return await Bun.write(`${stackDir}/docker-compose.yaml`, YamlDump);
  } catch (error) {
    throw new Error(`Could not write Docker Compose file ${error}`);
  }
}

function parseVars(deployConfig: Record<string, string>, data: string) {
  data.replace(/{{(.*?)}}/g, (_, key) => deployConfig[key.trim()] ?? "");

  const matches = data.search(/{{(.*?)}}/g);

  if (matches <= 0) {
    throw new Error(
      "Not all variables were provided values in the deploy config"
    );
  }

  return data;
}

export function getStackDir(stackId: number, stackName: string) {
  const pId = Number(stackId);
  const pSN = String(stackName).replaceAll("../", "").replaceAll("..\\", "");
  return `./stacks/stackId${pId}-stackName${pSN}`;
}
