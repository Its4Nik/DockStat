import YAML from "yaml";
import { dbFunctions } from "~/core/database";
import { findObjectByKey } from "~/core/utils/helpers";
import { logger } from "~/core/utils/logger";
import type { Stack } from "~/typings/docker-compose";

export async function getStackName(stack_id: number): Promise<string> {
	logger.debug(`Fetching stack name for id ${stack_id}`);
	const stacks = dbFunctions.getStacks();
	const stack = findObjectByKey(stacks, "id", stack_id);
	if (!stack) {
		throw new Error(`Stack with id ${stack_id} not found`);
	}
	return stack.name;
}

export async function getStackPath(stack: Stack): Promise<string> {
	const stackName = stack.name.trim().replace(/\s+/g, "_");
	const stackId = stack.id;

	if (!stackId) {
		logger.error("Stack could not be parsed");
		throw new Error("Stack could not be parsed");
	}

	return `stacks/${stackId}-${stackName}`;
}

export async function createStackYAML(compose_spec: Stack): Promise<void> {
	const yaml = YAML.stringify(compose_spec.compose_spec);
	const stackPath = await getStackPath(compose_spec);
	await Bun.write(`${stackPath}/docker-compose.yaml`, yaml, {
		createPath: true,
	});
}
