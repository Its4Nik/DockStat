import yaml from "js-yaml";
import { dbFunctions } from "../database";
import { logger } from "../utils/logger";

const stacks = dbFunctions.getStacks();

export async function checkStacks() {
	logger.debug(`Checking ${stacks.length} stack(s)`);
	for (const stack of stacks) {
		try {
			const composeFilePath =
				`stacks/${stack.id}-${stack.name}/docker-compose.yaml`.replaceAll(
					" ",
					"_",
				);
			const composeFile = Bun.file(composeFilePath);
			logger.debug(`Checking ${stack.id} - ${composeFilePath}`);

			if (!(await composeFile.exists())) {
				logger.error(`Stack (${stack.id} - ${stack.name}) has no compose file`);
				dbFunctions.setStackStatus(stack, "error");
				continue;
			}

			if (
				stack.compose_spec !==
				JSON.stringify(yaml.load(await composeFile.text()))
			) {
				logger.error(
					`Stack (${stack.id} - ${stack.name}) does not match the saved compose file`,
				);
				logger.debug(`Database config: ${stack.compose_spec}`);
				logger.debug(
					`Compose config: ${JSON.stringify(
						yaml.load(await composeFile.text()),
					)}`,
				);
				dbFunctions.setStackStatus(stack, "error");
				continue;
			}

			dbFunctions.setStackStatus(stack, "active");
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(errorMsg);
		}
	}

	logger.info("Checked stacks");
}
