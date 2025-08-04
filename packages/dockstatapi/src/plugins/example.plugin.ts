import { logger } from "~/core/utils/logger";

import type { ContainerInfo } from "~/typings/docker";
import type { Plugin } from "~/typings/plugin";

// See https://outline.itsnik.de/s/dockstat/doc/plugin-development-3UBj9gNMKF for more info

const ExamplePlugin: Plugin = {
	name: "Example Plugin",
	version: "1.0.0",

	async onContainerStart(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} started on ${containerInfo.hostId}`,
		);
	},

	async onContainerStop(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} stopped on ${containerInfo.hostId}`,
		);
	},

	async onContainerExit(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} exited on ${containerInfo.hostId}`,
		);
	},

	async onContainerCreate(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} created on ${containerInfo.hostId}`,
		);
	},

	async onContainerDestroy(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} destroyed on ${containerInfo.hostId}`,
		);
	},

	async onContainerPause(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} pause on ${containerInfo.hostId}`,
		);
	},

	async onContainerUnpause(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} resumed on ${containerInfo.hostId}`,
		);
	},

	async onContainerRestart(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} restarted on ${containerInfo.hostId}`,
		);
	},

	async onContainerUpdate(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} updated on ${containerInfo.hostId}`,
		);
	},

	async onContainerRename(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} renamed on ${containerInfo.hostId}`,
		);
	},

	async onContainerHealthStatus(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} changed status to ${containerInfo.status}`,
		);
	},

	async onHostUnreachable(host: string, err: string) {
		logger.info(`Server ${host} unreachable - ${err}`);
	},

	async onHostReachableAgain(host: string) {
		logger.info(`Server ${host} reachable`);
	},

	async handleContainerDie(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} died on ${containerInfo.hostId}`,
		);
	},

	async onContainerKill(containerInfo: ContainerInfo) {
		logger.info(
			`Container ${containerInfo.name} killed on ${containerInfo.hostId}`,
		);
	},
} satisfies Plugin;

export default ExamplePlugin;
