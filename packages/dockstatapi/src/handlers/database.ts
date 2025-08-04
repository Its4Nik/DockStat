import { dbFunctions } from "~/core/database";
import type { container_stats } from "~/typings/database";
import type { HostStats } from "~/typings/docker";

class databaseHandler {
	getContainers(): container_stats[] {
		return dbFunctions.getContainerStats();
	}

	getHosts(): HostStats[] {
		return dbFunctions.getHostStats();
	}
}

export const DatabaseHandler = new databaseHandler();
