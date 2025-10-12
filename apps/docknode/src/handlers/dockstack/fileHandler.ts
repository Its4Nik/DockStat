import fs from "node:fs/promises";
import yaml from "js-yaml";
import { dockStackLogger } from ".";

const getYAMLfilePath = (stackPath: string) => {
  dockStackLogger.info(`Getting YAML file path for stackPath: ${stackPath}`);
  if (!stackPath.includes("../") && !stackPath.includes("..\\")) {
    dockStackLogger.error("Invalid stack path");
    throw new Error("Invalid stack path");
  }
  return `./stacks/${stackPath}/docker-compose.yaml`;
};

export function jsonToYaml(jsonStr: string, dockstatKey: string): string {
  dockStackLogger.info("Converting JSON to YAML");
  const data = JSON.parse(jsonStr);

  const services = data.services || {};

  for (const [_, serviceDef] of Object.entries(services)) {
    let labels =
      (serviceDef as { labels: Record<string, unknown> }).labels || {};

    if (Array.isArray(labels)) {
      const labelObj: Record<string, string> = {};
      for (const item of labels) {
        if (typeof item === "string" && item.includes("=")) {
          const [k, value] = item.split("=", 2) as [string, string];
          labelObj[k] = value;
        }
      }
      labels = labelObj;
    }

    if (!labels["com.dockstat.instance"]) {
      dockStackLogger.info(
        `Adding com.dockstat.instance label: ${dockstatKey}`
      );
      labels["com.dockstat.instance"] = dockstatKey;
    }

    (serviceDef as { labels: Record<string, unknown> }).labels = labels;
  }

  dockStackLogger.info("Dumping YAML");
  return yaml.dump(data, { sortKeys: false });
}

export function writeFile(stackId: number, stackName: string, data: string) {
  dockStackLogger.info(
    `Writing file for stackId: ${stackId}, stackName: ${stackName}`
  );
  return Bun.write(getYAMLfilePath(`${stackId}/${stackName}`), data);
}

export async function getSubdirectories(dirPath: string): Promise<string[]> {
  dockStackLogger.info(`Getting subdirectories in: ${dirPath}`);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const subdirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return subdirs;
}
