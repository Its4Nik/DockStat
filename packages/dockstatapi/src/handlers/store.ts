import {
	addStoreRepo,
	deleteStoreRepo,
	getStoreRepos,
} from "~/core/database/stores";

class store {
	/**
	 *
	 * @returns an Array of all Repos added to the Database
	 * @example
	 * ```json
	 * [
	 *  {
	 *    slug: "DockStacks",
	 *    base: "https://raw.githubusercontent.com/Its4Nik/DockStacks/refs/heads/main/Index.json"
	 *  }
	 * ]
	 * ```
	 */
	getRepos(): {
		slug: string;
		base: string;
	}[] {
		return getStoreRepos();
	}

	/**
	 *
	 * @param slug - "Nickname" for this repo
	 * @param base - The raw URL of where the [ROOT].json is located
	 * @example
	 * ```ts
	 * addRepo("DockStacks", "https://raw.githubusercontent.com/Its4Nik/DockStacks/refs/heads/main/Index.json")
	 * ```
	 */
	addRepo(slug: string, base: string) {
		return addStoreRepo(slug, base);
	}

	/**
	 * Deletes a Repo from the Database
	 * @param slug
	 * @returns Changes
	 */
	deleteRepo(slug: string) {
		return deleteStoreRepo(slug);
	}
}

export const StoreHandler = new store();
