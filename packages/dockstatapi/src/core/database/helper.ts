import { logger } from "~/core/utils/logger";
import { backupInProgress } from "./_dbState";

export function executeDbOperation<T>(
	label: string,
	operation: () => T,
	validate?: () => void,
	dontLog?: boolean,
): T {
	if (backupInProgress && label !== "backup" && label !== "restore") {
		throw new Error(
			`backup in progress Database operation not allowed: ${label}`,
		);
	}
	const startTime = Date.now();
	if (dontLog !== true) {
		logger.debug(`__task__ __db__ ${label} ⏳`);
	}
	if (validate) {
		validate();
	}
	const result = operation();
	const duration = Date.now() - startTime;
	if (dontLog !== true) {
		logger.debug(`__task__ __db__ ${label} ✔️  (${duration}ms)`);
	}
	return result;
}
