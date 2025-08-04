import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { dbFunctions } from "~/core/database";
import { backupDir } from "~/core/database/backup";
import { reloadSchedules } from "~/core/docker/scheduler";
import { pluginManager } from "~/core/plugins/plugin-manager";
import { logger } from "~/core/utils/logger";
import {
	authorEmail,
	authorName,
	authorWebsite,
	contributors,
	dependencies,
	description,
	devDependencies,
	license,
	version,
} from "~/core/utils/package-json";
import type { config } from "~/typings/database";
import type { DockerHost } from "~/typings/docker";
import type { PluginInfo } from "~/typings/plugin";

class apiHandler {
	getConfig(): config {
		try {
			const data = dbFunctions.getConfig() as config[];
			const distinct = data[0];

			logger.debug("Fetched backend config");
			return distinct;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async updateConfig(fetching_interval: number, keep_data_for: number) {
		try {
			logger.debug(
				`Updated config: fetching_interval: ${fetching_interval} - keep_data_for: ${keep_data_for}`,
			);
			dbFunctions.updateConfig(fetching_interval, keep_data_for);
			await reloadSchedules();
			return "Updated DockStatAPI config";
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	getPlugins(): PluginInfo[] {
		try {
			logger.debug("Gathering plugins");
			return pluginManager.getPlugins();
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	getPackage() {
		try {
			logger.debug("Fetching package.json");
			const data: {
				version: string;
				description: string;
				license: string;
				authorName: string;
				authorEmail: string;
				authorWebsite: string;
				contributors: string[];
				dependencies: Record<string, string>;
				devDependencies: Record<string, string>;
			} = {
				version: version,
				description: description,
				license: license,
				authorName: authorName,
				authorEmail: authorEmail,
				authorWebsite: authorWebsite,
				contributors: contributors,
				dependencies: dependencies,
				devDependencies: devDependencies,
			};

			logger.debug(
				`Received: ${JSON.stringify(data).length} chars in package.json`,
			);

			if (JSON.stringify(data).length <= 10) {
				throw new Error("Failed to read package.json");
			}

			return data;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async createbackup(): Promise<string> {
		try {
			const backupFilename = await dbFunctions.backupDatabase();
			return backupFilename;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async listBackups() {
		try {
			const backupFiles = readdirSync(backupDir);

			const filteredFiles = backupFiles.filter((file: string) => {
				return !(
					file.startsWith(".") ||
					file.endsWith(".db") ||
					file.endsWith(".db-shm") ||
					file.endsWith(".db-wal")
				);
			});

			return filteredFiles;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async downloadbackup(downloadFile?: string) {
		try {
			const filename: string = downloadFile || dbFunctions.findLatestBackup();
			const filePath = `${backupDir}/${filename}`;

			if (!existsSync(filePath)) {
				throw new Error("Backup file not found");
			}

			return Bun.file(filePath);
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async restoreBackup(file: File) {
		try {
			if (!file) {
				throw new Error("No file uploaded");
			}

			if (!(file.name || "").endsWith(".db.bak")) {
				throw new Error("Invalid file type. Expected .db.bak");
			}

			const tempPath = `${backupDir}/upload_${Date.now()}.db.bak`;
			const fileBuffer = await file.arrayBuffer();

			await Bun.write(tempPath, fileBuffer);
			dbFunctions.restoreDatabase(tempPath);
			unlinkSync(tempPath);

			return "Database restored successfully";
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async addHost(host: DockerHost) {
		try {
			dbFunctions.addDockerHost(host);
			return `Added docker host (${host.name} - ${host.hostAddress})`;
		} catch (error: unknown) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async updateHost(host: DockerHost) {
		try {
			dbFunctions.updateDockerHost(host);
			return `Updated docker host (${host.id})`;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async removeHost(id: number) {
		try {
			dbFunctions.deleteDockerHost(id);
			return `Deleted docker host (${id})`;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}
}

export const ApiHandler = new apiHandler();
