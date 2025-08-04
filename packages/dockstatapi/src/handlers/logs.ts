import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";

class logHandler {
	async getLogs(level?: string) {
		if (!level) {
			try {
				const logs = dbFunctions.getAllLogs();
				logger.debug("Retrieved all logs");
				return logs;
			} catch (error) {
				logger.error("Failed to retrieve logs,", error);
				throw new Error("Failed to retrieve logs");
			}
		}
		try {
			const logs = dbFunctions.getLogsByLevel(level);

			logger.debug(`Retrieved logs (level: ${level})`);
			return logs;
		} catch (error) {
			logger.error(`Failed to retrieve logs: ${error}`);
			throw new Error(`Failed to retrieve logs: ${error}`);
		}
	}

	async deleteLogs(level?: string) {
		if (!level) {
			try {
				dbFunctions.clearAllLogs();
				return { success: true };
			} catch (error) {
				logger.error("Could not delete all logs,", error);
				throw new Error("Could not delete all logs");
			}
		}

		try {
			dbFunctions.clearLogsByLevel(level);

			logger.debug(`Cleared all logs with level: ${level}`);
			return { success: true };
		} catch (error) {
			logger.error("Could not clear logs with level", level, ",", error);
			throw new Error("Failed to retrieve logs");
		}
	}
}

export const LogHandler = new logHandler();
