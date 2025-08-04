import DockerCompose from "docker-compose";
import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";
import { runStackCommand } from "./runStackCommand";

interface DockerServiceStatus {
	status: string;
	ports: string[];
}

interface StackStatus {
	services: Record<string, DockerServiceStatus>;
	healthy: number;
	unhealthy: number;
	total: number;
}

type StacksStatus = Record<string, StackStatus>;

export async function getStackStatus(
	stack_id: number,
	//biome-ignore lint/suspicious/noExplicitAny:
): Promise<Record<string, any>> {
	const status = await runStackCommand(
		stack_id,
		async (cwd) => {
			const rawStatus = await DockerCompose.ps({ cwd });
			//biome-ignore lint/suspicious/noExplicitAny:
			return rawStatus.data.services.reduce((acc: any, service: any) => {
				acc[service.name] = service.state;
				return acc;
			}, {});
		},
		"status-check",
	);
	return status;
}

export async function getAllStacksStatus(): Promise<StacksStatus> {
	try {
		const stacks = dbFunctions.getStacks();

		const statusResults = await Promise.all(
			stacks.map(async (stack) => {
				const status = await runStackCommand(
					stack.id as number,
					async (cwd) => {
						const rawStatus = await DockerCompose.ps({ cwd });
						const services = rawStatus.data.services.reduce(
							(acc: Record<string, DockerServiceStatus>, service) => {
								acc[service.name] = {
									status: service.state,
									ports: service.ports.map(
										(port) => `${port.mapped?.address}:${port.mapped?.port}`,
									),
								};
								return acc;
							},
							{},
						);

						const statusValues = Object.values(services);
						return {
							services,
							healthy: statusValues.filter(
								(s) => s.status === "running" || s.status.includes("Up"),
							).length,
							unhealthy: statusValues.filter(
								(s) => s.status !== "running" && !s.status.includes("Up"),
							).length,
							total: statusValues.length,
						};
					},
					"status-check",
				);
				return { stackId: stack.id, status };
			}),
		);

		return statusResults.reduce((acc, { stackId, status }) => {
			acc[String(stackId)] = status;
			return acc;
		}, {} as StacksStatus);
	} catch (error: unknown) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(errorMsg);
		throw new Error(errorMsg);
	}
}
