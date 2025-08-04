import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
	insert: db.prepare(`
		INSERT INTO store_repos (slug, base) VALUES (?, ?)
	`),
	selectAll: db.prepare(`
		SELECT slug, base FROM store_repos
	`),
	delete: db.prepare(`
        DELETE FROM store_repos WHERE slug = ?
    `),
};

export function getStoreRepos() {
	return executeDbOperation("Get Store Repos", () => stmt.selectAll.all()) as {
		slug: string;
		base: string;
	}[];
}

export function addStoreRepo(slug: string, base: string) {
	return executeDbOperation("Add Store Repo", () =>
		stmt.insert.run(slug, base),
	);
}

export function deleteStoreRepo(slug: string) {
	return executeDbOperation("Delete Store Repo", () => stmt.delete.run(slug));
}
