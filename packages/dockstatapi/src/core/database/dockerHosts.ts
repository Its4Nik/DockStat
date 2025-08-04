import type { DockerHost } from "~/typings/docker";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
	insert: db.prepare(
		"INSERT INTO docker_hosts (name, hostAddress, secure) VALUES (?, ?, ?)",
	),
	selectAll: db.prepare(
		"SELECT id, name, hostAddress, secure FROM docker_hosts ORDER BY id DESC",
	),
	update: db.prepare(
		"UPDATE docker_hosts SET hostAddress = ?, secure = ?, name = ? WHERE id = ?",
	),
	delete: db.prepare("DELETE FROM docker_hosts WHERE id = ?"),
};

export function addDockerHost(host: DockerHost) {
	return executeDbOperation(
		"Add Docker Host",
		() => stmt.insert.run(host.name, host.hostAddress, host.secure),
		() => {
			if (!host.name || !host.hostAddress)
				throw new Error("Missing required fields");
			if (typeof host.secure !== "boolean")
				throw new TypeError("Invalid secure type");
		},
	);
}

export function getDockerHosts(): DockerHost[] {
	return executeDbOperation("Get Docker Hosts", () => {
		const rows = stmt.selectAll.all() as Array<
			Omit<DockerHost, "secure"> & { secure: number }
		>;
		return rows.map((row) => ({
			...row,
			secure: row.secure === 1,
		}));
	});
}
1;
export function updateDockerHost(host: DockerHost) {
	return executeDbOperation(
		"Update Docker Host",
		() => stmt.update.run(host.hostAddress, host.secure, host.name, host.id),
		() => {
			if (!host.id || typeof host.id !== "number")
				throw new Error("Invalid host ID");
		},
	);
}

export function deleteDockerHost(id: number) {
	return executeDbOperation(
		"Delete Docker Host",
		() => stmt.delete.run(id),
		() => {
			if (typeof id !== "number") throw new TypeError("Invalid ID type");
		},
	);
}
