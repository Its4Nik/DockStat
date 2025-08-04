import { PassThrough, type Readable } from "node:stream";
import { logger } from "~/core/utils/logger";
import type { log_message } from "~/typings/database";

const activeStreams = new Set<PassThrough>();

export function createLogStream(): Readable {
	const stream = new PassThrough({ objectMode: true });

	activeStreams.add(stream);
	logger.info(`New Logs stream created. Active streams: ${activeStreams.size}`);

	const removeStream = () => {
		if (activeStreams.delete(stream)) {
			logger.info(`Logs stream closed. Active streams: ${activeStreams.size}`);
			if (!stream.destroyed) {
				stream.destroy();
			}
		}
	};

	stream.on("close", removeStream);
	stream.on("end", removeStream);
	stream.on("error", (error) => {
		logger.error(`Stream error: ${error.message}`);
		removeStream();
	});

	return stream;
}

export function logToClients(data: log_message): void {
	for (const stream of activeStreams) {
		try {
			if (stream.writable && !stream.destroyed) {
				const success = stream.write(data);
				if (!success) {
					logger.warn("Log stream buffer full, data may be delayed");
				}
			}
		} catch (error) {
			logger.error(
				`Failed to write to log stream: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
			activeStreams.delete(stream);
			if (!stream.destroyed) {
				stream.destroy();
			}
		}
	}
}
