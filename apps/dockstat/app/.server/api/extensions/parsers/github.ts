import type { RepoManifestType } from "@dockstat/typings/types";
import { logger } from "..";

export async function getGitHubPluginManifest(
	repoSource: string,
	pluginName: string,
) {
	const owner = repoSource.split("/")[0];
	const repo = repoSource.split("/")[1].split(":")[0];
	logger.debug(`Repo Owner: ${owner} Repo Name: ${repo}`);

	if (!owner || !repo) {
		throw new Error("Invalid GitHub repository URL");
	}

	const branchAndPath = repoSource.split(":")[1] || "";

	const path = `${branchAndPath}/src/content/plugins/${encodeURI(pluginName)}/manifest.yml`;

	const builtPath = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${path}`;

	logger.debug(`Fetching Plugin Manifest from: ${builtPath}`);

	const res = await fetch(builtPath);

	if (path.endsWith(".yml")) {
		return Bun.YAML.parse(await res.text()) as RepoManifestType;
	}

	throw new Error("Invalid file extension, needs to be .yml");
}

export async function getGitHubRepoManifest(repoSource: string) {
	const path = buildGitHubLink(`${repoSource}/manifest.yml`);

	const res = await fetch(path);

	if (path.endsWith(".yml")) {
		return Bun.YAML.parse(await res.text()) as RepoManifestType;
	}

	throw new Error("Manifest needs to end in .yml");
}

export function buildGitHubLink(repoSource: string, raw = true) {
	const owner = repoSource.split("/")[0];
	const repo = repoSource.split("/")[1].split(":")[0];
	logger.debug(`Repo Owner: ${owner} Repo Name: ${repo}`);

	if (!owner || !repo) {
		throw new Error("Invalid GitHub repository URL");
	}

	const branchAndPath = repoSource.split(":")[1] || "";

	const path = `${branchAndPath}`;

	let builtPath = "";
	if (raw) {
		builtPath = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${path}`;
	} else {
		builtPath = `https://github.com/${owner}/${repo}/tree/${path}`;
	}

	logger.debug(`Built path: ${builtPath}`);
	return builtPath;
}
