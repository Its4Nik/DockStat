import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
	update: db.prepare(
		"UPDATE config SET fetching_interval = ?, keep_data_for = ?",
	),
	select: db.prepare("SELECT keep_data_for, fetching_interval FROM config"),
	deleteOld: db.prepare(
		`DELETE FROM container_stats WHERE timestamp < datetime('now', '-' || ? || ' days')`,
	),
	deleteOldLogs: db.prepare(
		`DELETE FROM backend_log_entries WHERE timestamp < datetime('now', '-' || ? || ' days')`,
	),
};

export function updateConfig(fetching_interval: number, keep_data_for: number) {
	return executeDbOperation(
		"Update Config",
		() => stmt.update.run(fetching_interval, keep_data_for),
		() => {
			if (
				typeof fetching_interval !== "number" ||
				typeof keep_data_for !== "number"
			) {
				throw new TypeError("Invalid config parameters");
			}
		},
	);
}

export function getConfig() {
	return executeDbOperation("Get Config", () => stmt.select.all());
}

export function deleteOldData(days: number) {
	return executeDbOperation(
		"Delete Old Data",
		() => {
			db.transaction(() => {
				stmt.deleteOld.run(days);
				stmt.deleteOldLogs.run(days);
			})();
		},
		() => {
			if (typeof days !== "number") throw new TypeError("Invalid days type");
		},
	);
}
