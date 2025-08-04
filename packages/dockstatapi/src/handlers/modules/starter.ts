import { setSchedules } from "~/core/docker/scheduler";
import { pluginManager } from "~/core/plugins/plugin-manager";
import { startDockerStatsBroadcast } from "./docker-socket";

function banner(msg: string) {
	const fenced = `= ${msg} =`;
	const lines = msg.length;
	console.info("=".repeat(fenced.length));
	console.info(fenced);
	console.info("=".repeat(fenced.length));
}

class starter {
	public started = false;
	async startAll() {
		try {
			if (!this.started) {
				banner("Setting schedules");
				await setSchedules();
				banner("Importing plugins");
				await startDockerStatsBroadcast();
				banner("Started DockStatAPI succesfully");
				await pluginManager.start();
				banner("Starting WebSocket server");
				this.started = true;
				return;
			}
			console.info("Already started");
		} catch (error) {
			throw new Error(`Could not start DockStatAPI: ${error}`);
		}
	}
}

export const Starter = new starter();
