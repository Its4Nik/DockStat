import { readFile } from "node:fs/promises";
import { logger } from "~/core/utils/logger";

export async function checkFileForChangeMe(filePath: string) {
	const regex = /change[\W_]*me/i;
	let content = "";
	try {
		content = await readFile(filePath, "utf-8");
	} catch (error) {
		logger.error("Error reading file:", error);
	}

	if (regex.test(content)) {
		throw new Error(
			`The file contains ${regex.exec(content)}. Please update it.`,
		);
	}
}
