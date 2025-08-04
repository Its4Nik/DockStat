import type { log_message } from "~/typings/database";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
	insert: db.prepare(
		"INSERT INTO backend_log_entries (level, timestamp, message, file, line) VALUES (?, ?, ?, ?, ?)",
	),
	selectAll: db.prepare(
		"SELECT level, timestamp, message, file, line FROM backend_log_entries ORDER BY timestamp DESC",
	),
	selectByLevel: db.prepare(
		"SELECT level, timestamp, message, file, line FROM backend_log_entries WHERE level = ?",
	),
	deleteAll: db.prepare("DELETE FROM backend_log_entries"),
	deleteByLevel: db.prepare("DELETE FROM backend_log_entries WHERE level = ?"),
};

function convertToLogMessage(row: log_message): log_message {
	return {
		level: row.level,
		timestamp: row.timestamp,
		message: row.message,
		file: row.file,
		line: row.line,
	};
}

export function addLogEntry(data: log_message) {
	return executeDbOperation(
		"Add Log Entry",
		() =>
			stmt.insert.run(
				data.level,
				data.timestamp,
				data.message,
				data.file,
				data.line,
			),
		() => {
			if (
				typeof data.level !== "string" ||
				typeof data.timestamp !== "string" ||
				typeof data.message !== "string" ||
				typeof data.file !== "string" ||
				typeof data.line !== "number"
			) {
				throw new TypeError(
					`Invalid log entry parameters ${data.file} ${data.line} ${data.message} ${data}`,
				);
			}
		},
		true,
	);
}

export function getAllLogs(): log_message[] {
	return executeDbOperation("Get All Logs", () =>
		stmt.selectAll.all().map((row) => convertToLogMessage(row as log_message)),
	);
}

export function getLogsByLevel(level: string): log_message[] {
	return executeDbOperation("Get Logs By Level", () =>
		stmt.selectByLevel
			.all(level)
			.map((row) => convertToLogMessage(row as log_message)),
	);
}

export function clearAllLogs() {
	return executeDbOperation("Clear All Logs", () => stmt.deleteAll.run());
}

export function clearLogsByLevel(level: string) {
	return executeDbOperation("Clear Logs By Level", () =>
		stmt.deleteByLevel.run(level),
	);
}
