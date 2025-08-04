import { logger } from "~/core/utils/logger";

export async function CheckHealth(): Promise<"healthy"> {
	logger.info("Checking health");
	return "healthy";
}
