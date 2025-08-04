import { PassThrough, type Readable } from "node:stream";
import { logger } from "~/core/utils/logger";

const activeStreams = new Set<PassThrough>();

export function createStackStream(): Readable {
	const stream = new PassThrough({ objectMode: true });

	activeStreams.add(stream);
	logger.info(
		`New Stack stream created. Active streams: ${activeStreams.size}`,
	);

	const removeStream = () => {
		if (activeStreams.delete(stream)) {
			logger.info(`Stack stream closed. Active streams: ${activeStreams.size}`);
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
