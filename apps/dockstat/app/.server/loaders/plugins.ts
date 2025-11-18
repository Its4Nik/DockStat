import { api } from "../treaty";

export async function PluginsLoader() {
	const [installedPlugins, dockstatConfig, status] = await Promise.all([
		api.plugins.all.get(),
		api.db["dockstat-config"].get(),
		api.plugins.status.get(),
	]);

	if (installedPlugins.error) {
		return { error: installedPlugins.error };
	}

	if (status.error) {
		return { error: status.error };
	}

	if (dockstatConfig.error) {
		return { error: dockstatConfig.error };
	}

	return {
		status: status.data,
		installedPlugins: installedPlugins.data,
	};
}
