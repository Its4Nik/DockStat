import { logger } from "~/core/utils/logger";
import type { Stack } from "~/typings/docker-compose";
import { broadcast } from "../../../handlers/modules/docker-socket";
import { getStackName, getStackPath } from "./stackHelpers";

export function wrapProgressCallback(progressCallback?: (log: string) => void) {
	return progressCallback
		? (chunk: Buffer) => {
				const log = chunk.toString();
				progressCallback(log);
			}
		: undefined;
}

export async function runStackCommand<T>(
	stack_id: number,
	command: (
		cwd: string,
		progressCallback?: (log: string) => void,
	) => Promise<T>,
	action: string,
): Promise<T> {
	try {
		logger.debug(
			`Starting runStackCommand for stack_id=${stack_id}, action="${action}"`,
		);

		const stackName = await getStackName(stack_id);
		logger.debug(
			`Retrieved stack name "${stackName}" for stack_id=${stack_id}`,
		);

		const stackPath = await getStackPath({
			id: stack_id,
			name: stackName,
		} as Stack);
		logger.debug(`Resolved stack path "${stackPath}" for stack_id=${stack_id}`);

		const progressCallback = (log: string) => {
			const message = log.trim();
			logger.debug(
				`Progress for stack_id=${stack_id}, action="${action}": ${message}`,
			);

			if (message.includes("Error response from daemon")) {
				const extracted = message.match(/Error response from daemon: (.+)/);
				if (extracted) {
					logger.error(`Error response from daemon: ${extracted[1]}`);
				}
			}

			// Broadcast progress
			broadcast({
				topic: "stack",
				data: {
					timestamp: new Date(),
					type: "stack-progress",
					data: {
						stack_id,
						message,
						action,
					},
				},
			});
		};

		logger.debug(
			`Executing command for stack_id=${stack_id}, action="${action}"`,
		);
		const result = await command(stackPath, progressCallback);
		logger.debug(
			`Successfully completed command for stack_id=${stack_id}, action="${action}"`,
		);

		// Optionally broadcast status on completion
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-status",
				data: {
					stack_id,
					status: "completed",
					message: `Completed ${action}`,
					action,
				},
			},
		});

		return result;
	} catch (error: unknown) {
		const errorMsg =
			error instanceof Error ? error.message : JSON.stringify(error);
		logger.debug(
			`Error occurred for stack_id=${stack_id}, action="${action}": ${errorMsg}`,
		);

		// Broadcast error
		broadcast({
			topic: "stack",
			data: {
				timestamp: new Date(),
				type: "stack-error",
				data: {
					stack_id,
					action,
					message: errorMsg,
				},
			},
		});

		throw new Error(`Error while ${action} stack "${stack_id}": ${errorMsg}`);
	}
}
