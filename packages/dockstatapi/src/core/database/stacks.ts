import type { stacks_config } from "~/typings/database";
import { findObjectByKey } from "../utils/helpers";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
	insert: db.prepare(`
    INSERT INTO stacks_config (
      name, version, custom, source, compose_spec, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `),
	selectAll: db.prepare(`
    SELECT id, name, version, custom, source, compose_spec, status
    FROM stacks_config
    ORDER BY id DESC
  `),
	update: db.prepare(`
   	UPDATE stacks_config
   	SET name = ?, custom = ?, source = ?, compose_spec = ?
    WHERE id = ?
  `),
	setStatus: db.prepare(`
    UPDATE stacks_config
    SET status = ?
    WHERE id = ?
    `),
	delete: db.prepare("DELETE FROM stacks_config WHERE id = ?"),
};

export function addStack(stack: stacks_config) {
	executeDbOperation("Add Stack", () =>
		stmt.insert.run(
			stack.name,
			stack.version,
			stack.custom,
			stack.source,
			stack.compose_spec,
			"active",
		),
	);

	return findObjectByKey(getStacks(), "name", stack.name)?.id;
}

export function getStacks() {
	return executeDbOperation("Get Stacks", () =>
		stmt.selectAll.all(),
	) as stacks_config[];
}

export function deleteStack(id: number) {
	return executeDbOperation(
		"Delete Stack",
		() => stmt.delete.run(id),
		() => {
			if (typeof id !== "number") throw new TypeError("Invalid stack ID");
		},
	);
}

export function updateStack(stack: stacks_config) {
	return executeDbOperation("Update Stack", () => {
		if (!stack.id) {
			throw new Error("Stack ID needed");
		}
		stmt.update.run(
			stack.id,
			stack.version,
			stack.custom,
			stack.source,
			stack.name,
			stack.compose_spec,
		);
	});
}

export function setStackStatus(
	stack: stacks_config,
	status: "active" | "error" = "active",
) {
	if (!stack.id) {
		throw new Error("Stack ID needed");
	}
	stmt.setStatus.run(status, stack.id);
}
