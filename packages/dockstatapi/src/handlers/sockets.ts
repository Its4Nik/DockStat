import { WSServer } from "./modules/docker-socket";
import { createStackStream } from "./modules/live-stacks";
import { createLogStream } from "./modules/logs-socket";

export const Sockets = {
	dockerStatsStream: `${WSServer.hostname}${WSServer.port}/ws`,
	createLogStream,
	createStackStream,
};
