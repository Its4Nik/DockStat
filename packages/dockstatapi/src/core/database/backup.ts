import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { logger } from "~/core/utils/logger";
import type { BackupInfo } from "~/typings/misc";
import { backupInProgress, setBackupInProgress } from "./_dbState";
import { db } from "./database";
import { executeDbOperation } from "./helper";

export const backupDir = "data/";

export async function backupDatabase(): Promise<string> {
	if (backupInProgress) {
		logger.error("Backup attempt blocked: Another backup already in progress");
		throw new Error("Backup already in progress");
	}

	logger.debug("Starting database backup process...");
	setBackupInProgress(true);

	try {
		logger.debug("Executing WAL checkpoint...");
		db.exec("PRAGMA wal_checkpoint(FULL);");
		logger.debug("WAL checkpoint completed successfully");

		const now = new Date();
		const day = String(now.getDate()).padStart(2, "0");
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const year = now.getFullYear();
		const dateStr = `${day}-${month}-${year}`;
		logger.debug(`Using date string for backup: ${dateStr}`);

		logger.debug(`Scanning backup directory: ${backupDir}`);
		const files = readdirSync(backupDir);
		logger.debug(`Found ${files.length} files in backup directory`);

		const regex = new RegExp(
			`^dockstatapi-${day}-${month}-${year}-(\\d+)\\.db\\.bak$`,
		);
		let maxBackupNum = 0;

		for (const file of files) {
			const match = file.match(regex);
			if (match?.[1]) {
				const num = Number.parseInt(match[1], 10);
				logger.debug(`Found existing backup file: ${file} with number ${num}`);
				if (num > maxBackupNum) {
					maxBackupNum = num;
				}
			} else {
				logger.debug(`Skipping non-matching file: ${file}`);
			}
		}

		logger.debug(`Maximum backup number found: ${maxBackupNum}`);
		const backupNumber = maxBackupNum + 1;
		const backupFilename = `${backupDir}dockstatapi-${dateStr}-${backupNumber}.db.bak`;
		logger.debug(`Generated backup filename: ${backupFilename}`);

		logger.debug(`Attempting to copy database to ${backupFilename}`);
		try {
			copyFileSync(`${backupDir}dockstatapi.db`, backupFilename);
			logger.info(`Backup created successfully: ${backupFilename}`);
			logger.debug("File copy operation completed without errors");
		} catch (error) {
			logger.error(`Failed to create backup file: ${(error as Error).message}`);
			throw new Error(error as string);
		}

		return backupFilename;
	} finally {
		setBackupInProgress(false);
		logger.debug("Backup process completed, in progress flag reset");
	}
}

export function restoreDatabase(backupFilename: string): void {
	const backupFile = `${backupDir}${backupFilename}`;

	if (backupInProgress) {
		logger.error("Restore attempt blocked: Backup in progress");
		throw new Error("Backup in progress. Cannot restore.");
	}

	logger.debug(`Starting database restore from ${backupFile}`);

	if (!existsSync(backupFile)) {
		logger.error(`Backup file not found: ${backupFile}`);
		throw new Error(`Backup file ${backupFile} does not exist.`);
	}

	setBackupInProgress(true);
	try {
		executeDbOperation(
			"restore",
			() => {
				logger.debug(`Attempting to restore database from ${backupFile}`);
				try {
					copyFileSync(backupFile, `${backupDir}dockstatapi.db`);
					logger.info(`Database restored successfully from: ${backupFilename}`);
					logger.debug("Database file replacement completed");
				} catch (error) {
					logger.error(`Restore failed: ${(error as Error).message}`);
					throw new Error(error as string);
				}
			},
			() => {
				if (backupInProgress) {
					logger.error("Database operation attempted during restore");
					throw new Error("Cannot perform database operations during restore");
				}
			},
		);
	} finally {
		setBackupInProgress(false);
		logger.debug("Restore process completed, in progress flag reset");
	}
}

export const findLatestBackup = (): string => {
	logger.debug(`Searching for latest backup in directory: ${backupDir}`);

	const files = readdirSync(backupDir);
	logger.debug(`Found ${files.length} files to process`);

	const backups = files
		.map((file): BackupInfo | null => {
			const match = file.match(
				/^dockstatapi-(\d{2})-(\d{2})-(\d{4})-(\d+)\.db\.bak$/,
			);
			if (!match) {
				logger.debug(`Skipping non-backup file: ${file}`);
				return null;
			}

			const date = new Date(
				Number(match[3]),
				Number(match[2]) - 1,
				Number(match[1]),
			);
			logger.debug(
				`Found backup file: ${file} with date ${date.toISOString()}`,
			);

			return {
				filename: file,
				date,
				backupNum: Number(match[4]),
			};
		})
		.filter((backup): backup is BackupInfo => backup !== null)
		.sort((a, b) => {
			const dateDiff = b.date.getTime() - a.date.getTime();
			return dateDiff !== 0 ? dateDiff : b.backupNum - a.backupNum;
		});

	if (!backups.length) {
		logger.error("No valid backup files found");
		throw new Error("No backups available");
	}

	const latestBackup = backups[0].filename;
	logger.debug(`Determined latest backup file: ${latestBackup}`);
	return latestBackup;
};
