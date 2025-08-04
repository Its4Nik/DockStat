import { EventEmitter } from "node:events";
import type { ContainerInfo } from "~/typings/docker";
import type { Plugin, PluginInfo } from "~/typings/plugin";
import { logger } from "../utils/logger";
import { loadPlugins } from "./loader";

function getHooks(plugin: Plugin) {
	return {
		onContainerStart: !!plugin.onContainerStart,
		onContainerStop: !!plugin.onContainerStop,
		onContainerExit: !!plugin.onContainerExit,
		onContainerCreate: !!plugin.onContainerCreate,
		onContainerKill: !!plugin.onContainerKill,
		handleContainerDie: !!plugin.handleContainerDie,
		onContainerDestroy: !!plugin.onContainerDestroy,
		onContainerPause: !!plugin.onContainerPause,
		onContainerUnpause: !!plugin.onContainerUnpause,
		onContainerRestart: !!plugin.onContainerRestart,
		onContainerUpdate: !!plugin.onContainerUpdate,
		onContainerRename: !!plugin.onContainerRename,
		onContainerHealthStatus: !!plugin.onContainerHealthStatus,
		onHostUnreachable: !!plugin.onHostUnreachable,
		onHostReachableAgain: !!plugin.onHostReachableAgain,
	};
}

class PluginManager extends EventEmitter {
	private plugins: Map<string, Plugin> = new Map();
	private failedPlugins: Map<string, Plugin> = new Map();

	async start() {
		try {
			await loadPlugins("./server/src/plugins");
			return;
		} catch (error) {
			logger.error(`Failed to init plugin manager: ${error}`);
			return;
		}
	}

	fail(plugin: Plugin) {
		try {
			this.failedPlugins.set(plugin.name, plugin);
			logger.debug(`Set status to failed for plugin: ${plugin.name}`);
		} catch (error) {
			logger.error(`Adding failed plugin to list failed: ${error as string}`);
		}
	}

	register(plugin: Plugin) {
		try {
			this.plugins.set(plugin.name, plugin);
			logger.debug(`Registered plugin: ${plugin.name}`);
		} catch (error) {
			logger.error(
				`Registering plugin ${plugin.name} failed: ${error as string}`,
			);
		}
	}

	unregister(name: string) {
		this.plugins.delete(name);
	}

	getPlugins(): PluginInfo[] {
		const plugins: PluginInfo[] = [];

		for (const plugin of this.plugins.values()) {
			logger.debug(`Loaded plugin: ${JSON.stringify(plugin)}`);
			const hooks = getHooks(plugin);
			plugins.push({
				name: plugin.name,
				version: plugin.version,
				status: "active",
				usedHooks: hooks,
			});
		}

		for (const plugin of this.failedPlugins.values()) {
			logger.debug(`Loaded plugin: ${JSON.stringify(plugin)}`);
			const hooks = getHooks(plugin);
			plugins.push({
				name: plugin.name,
				version: plugin.version,
				status: "inactive",
				usedHooks: hooks,
			});
		}

		return plugins;
	}

	// Trigger plugin flows:
	handleContainerStop(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerStop?.(containerInfo);
		}
	}

	handleContainerStart(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerStart?.(containerInfo);
		}
	}

	handleContainerExit(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerExit?.(containerInfo);
		}
	}

	handleContainerCreate(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerCreate?.(containerInfo);
		}
	}

	handleContainerDestroy(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerDestroy?.(containerInfo);
		}
	}

	handleContainerPause(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerPause?.(containerInfo);
		}
	}

	handleContainerUnpause(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerUnpause?.(containerInfo);
		}
	}

	handleContainerRestart(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerRestart?.(containerInfo);
		}
	}

	handleContainerUpdate(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerUpdate?.(containerInfo);
		}
	}

	handleContainerRename(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerRename?.(containerInfo);
		}
	}

	handleContainerHealthStatus(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerHealthStatus?.(containerInfo);
		}
	}

	handleHostUnreachable(host: string, err: string) {
		for (const [, plugin] of this.plugins) {
			plugin.onHostUnreachable?.(host, err);
		}
	}

	handleHostReachableAgain(host: string) {
		for (const [, plugin] of this.plugins) {
			plugin.onHostReachableAgain?.(host);
		}
	}

	handleContainerKill(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerKill?.(containerInfo);
		}
	}

	handleContainerDie(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.handleContainerDie?.(containerInfo);
		}
	}
}

export const pluginManager = new PluginManager();
