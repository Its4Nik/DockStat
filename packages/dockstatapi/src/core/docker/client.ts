import Docker from "dockerode";
import { logger } from "~/core/utils/logger";
import type { DockerHost } from "~/typings/docker";

export const getDockerClient = (host: DockerHost): Docker => {
	try {
		logger.info(`Setting up host: ${JSON.stringify(host)}`);

		const inputUrl = host.hostAddress.includes("://")
			? host.hostAddress
			: `${host.secure ? "https" : "http"}://${host.hostAddress}`;
		const parsedUrl = new URL(inputUrl);
		const hostAddress = parsedUrl.hostname;
		const port = parsedUrl.port
			? Number.parseInt(parsedUrl.port)
			: host.secure
				? 2376
				: 2375;

		if (Number.isNaN(port) || port < 1 || port > 65535) {
			throw new Error("Invalid port number in Docker host URL");
		}

		return new Docker({
			protocol: host.secure ? "https" : "http",
			host: hostAddress,
			port,
			version: "v1.41",
			// TODO: Add TLS configuration if needed
		});
	} catch (error) {
		logger.error("Invalid Docker host URL configuration:", error);
		throw new Error("Invalid Docker host configuration");
	}
};
