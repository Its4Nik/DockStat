import { rm } from "node:fs/promises";
import DockerCompose from "docker-compose";
import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";
import type { stacks_config } from "~/typings/database";
import type { Stack } from "~/typings/docker-compose";
import type { ComposeSpec } from "~/typings/docker-compose";
import { broadcast } from "../../handlers/modules/docker-socket";
import { checkStacks } from "./checker";
import { runStackCommand } from "./operations/runStackCommand";
import { wrapProgressCallback } from "./operations/runStackCommand";
import {
	createStackYAML,
	getStackName,
	getStackPath,
} from "./operations/stackHelpers";

export async function deployStack(stack_config: stacks_config): Promise<void> {
	let stackId: number | null = null;
	let stackPath = "";

	try {
		logger.debug(`Deploying Stack: ${JSON.stringify(stack_config)}`);
		if (!stack_config.name) throw new Error("Stack name needed");

		const jsonStringStack = {
			...stack_config,
			compose_spec: JSON.stringify(stack_config.compose_spec),
		};

		stackId = dbFunctions.addStack(jsonStringStack) || null;
		if (!stackId) {
			throw new Error("Failed to add stack to database");
		}

		// Broadcast pending status
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-status",
				data: {
					stack_id: stackId,
					status: "pending",
					message: "Creating stack configuration",
				},
			},
		});

		const stackYaml: Stack = {
			id: stackId,
			name: stack_config.name,
			source: stack_config.source,
			version: stack_config.version,
			compose_spec: stack_config.compose_spec as unknown as ComposeSpec,
		};

		await createStackYAML(stackYaml);
		stackPath = await getStackPath(stackYaml);

		await runStackCommand(
			stackId,
			(cwd, progressCallback) =>
				DockerCompose.upAll({
					cwd,
					log: true,
					callback: wrapProgressCallback(progressCallback),
				}),
			"deploying",
		);

		// Broadcast deployed status
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-status",
				data: {
					stack_id: stackId,
					status: "deployed",
					message: "Stack deployed successfully",
				},
			},
		});

		await checkStacks();
	} catch (error: unknown) {
		const errorMsg =
			error instanceof Error ? error.message : JSON.stringify(error);
		logger.error(errorMsg);

		if (stackId !== null) {
			// Attempt to remove any containers created during failed deployment
			if (stackPath) {
				try {
					await DockerCompose.down({
						cwd: stackPath,
						log: false, // No need for progress logging during cleanup
					});
				} catch (downError) {
					const downErrorMsg =
						downError instanceof Error
							? downError.message
							: JSON.stringify(downError);
					logger.error(`Failed to cleanup containers: ${downErrorMsg}`);
				}
			}

			// Proceed with existing cleanup (DB and filesystem)
			dbFunctions.deleteStack(stackId);
			if (stackPath) {
				try {
					await rm(stackPath, { recursive: true });
				} catch (cleanupError) {
					logger.error(`Error cleaning up stack path: ${cleanupError}`);
				}
			}
		}

		// Broadcast deployment error
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-error",
				data: {
					stack_id: stackId ?? 0,
					action: "deploying",
					message: errorMsg,
				},
			},
		});
		throw new Error(errorMsg);
	}
}

export async function stopStack(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.down({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"stopping",
	);
}

export async function startStack(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.upAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"starting",
	);
}

export async function pullStackImages(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.pullAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"pulling-images",
	);
}

export async function restartStack(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.restartAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"restarting",
	);
}

export async function removeStack(stack_id: number): Promise<void> {
	try {
		if (!stack_id) {
			throw new Error("Stack ID needed");
		}

		await runStackCommand(
			stack_id,
			async (cwd, progressCallback) => {
				await DockerCompose.down({
					cwd,
					// Add 'volumes' flag to remove named volumes
					commandOptions: ["--volumes", "--remove-orphans"],
					log: true,
					callback: wrapProgressCallback(progressCallback),
				});
			},
			"removing",
		);

		const stackName = await getStackName(stack_id);
		const stackPath = await getStackPath({
			id: stack_id,
			name: stackName,
		} as Stack);

		try {
			await rm(stackPath, {
				recursive: true,
				force: true,
				maxRetries: 3,
				retryDelay: 300,
			});
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(errorMsg);
			// Broadcast removal error
			broadcast({
				topic: "stack",
				data: {
					timestamp: new Date(),
					type: "stack-error",
					data: {
						stack_id,
						action: "removing",
						message: `Directory removal failed: ${errorMsg}`,
					},
				},
			});
			throw new Error(errorMsg);
		}

		dbFunctions.deleteStack(stack_id);

		// Broadcast successful removal
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-removed",
				data: {
					stack_id,
					message: "Stack removed successfully",
				},
			},
		});
	} catch (error: unknown) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(errorMsg);
		// Broadcast removal error
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-error",
				data: {
					stack_id,
					action: "removing",
					message: errorMsg,
				},
			},
		});
		throw new Error(errorMsg);
	}
}

export { getStackStatus, getAllStacksStatus } from "./operations/stackStatus";
