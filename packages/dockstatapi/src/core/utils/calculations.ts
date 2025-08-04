import type Docker from "dockerode";

const calculateCpuPercent = (stats: Docker.ContainerStats): number => {
	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage;
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

	if (cpuDelta <= 0) {
		return 0.0000001;
	}

	if (systemDelta <= 0) {
		return 0.0000001;
	}

	const data = (cpuDelta / systemDelta) * 100;

	if (data === null) {
		return 0.0000001;
	}

	return data * 10;
};

const calculateMemoryUsage = (stats: Docker.ContainerStats): number => {
	if (stats.memory_stats.usage === null) {
		return 0.0000001;
	}

	const data = (stats.memory_stats.usage / stats.memory_stats.limit) * 100;

	return data;
};

function sumNetworkBytes(stats: Docker.ContainerStats) {
	const nets = stats.networks ?? {};
	return Object.values(nets).reduce(
		(acc, iface) => {
			acc.rx += iface.rx_bytes;
			acc.tx += iface.tx_bytes;
			return acc;
		},
		{ rx: 0, tx: 0 },
	);
}

/**
 * Given current and previous cumulative bytes + timestamps,
 * compute bytes/sec. If no previous sample, return 0.
 */
function calcRate(
	prevBytes: number,
	prevTime: string,
	currBytes: number,
	currTime: Date,
): number {
	const dateConst = new Date(prevTime);
	const deltaSec = (currTime.getTime() - dateConst.getTime()) / 1000;
	if (deltaSec <= 0) return 0;
	return (currBytes - prevBytes) / deltaSec;
}

export { calculateCpuPercent, calculateMemoryUsage, sumNetworkBytes, calcRate };
