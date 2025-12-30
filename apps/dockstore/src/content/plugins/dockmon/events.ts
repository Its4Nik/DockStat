import { createEvents } from "@dockstat/plugin-builder";
import type { DockMonTable } from "./types";
import {
	mapFromContainerMetricHookToDb,
	mapFromHostMetricHookToDb,
} from "./utils/mapTo";

const DockMonEvents = createEvents<DockMonTable>({
	"container:metrics": (ctx, { logger, table }) => {
		try {
			logger.debug(`Saving Container metrics for ${ctx.containerId}`);
			const data = mapFromContainerMetricHookToDb(ctx);
			table.insert(data);
			logger.info(
				`Container metrics saved for ${ctx.stats.name} (ID: ${ctx.containerId})`,
			);
		} catch (error) {
			logger.error(`Failed to save container metrics: ${error}`);
		}
	},
	"host:metrics": (ctx, { table, logger }) => {
		try {
			logger.debug(`Saving Host metrics for host ${ctx.hostId}`);
			const data = mapFromHostMetricHookToDb(ctx);
			table.insert(data);
			logger.info(
				`Host metrics saved for host ${ctx.metrics.hostName} (ID: ${ctx.hostId})`,
			);
		} catch (error) {
			logger.error(`Failed to save host metrics: ${error}`);
		}
	},
});

export default DockMonEvents;
