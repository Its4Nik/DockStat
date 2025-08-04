import path from "node:path";
import chalk from "chalk";
import type { ChalkInstance } from "chalk";
import type { TransformableInfo } from "logform";
import { createLogger, format, transports } from "winston";
import wrapAnsi from "wrap-ansi";

import { dbFunctions } from "~/core/database";

import { logToClients } from "../../handlers/modules/logs-socket";

import type { log_message } from "~/typings/database";

import { backupInProgress } from "../database/_dbState";

const padNewlines = true; //process.env.PAD_NEW_LINES !== "false";

type LogLevel =
	| "error"
	| "warn"
	| "info"
	| "debug"
	| "verbose"
	| "silly"
	| "task"
	| "ut";

// biome-ignore lint/suspicious/noControlCharactersInRegex: <benis>
const ansiRegex = /\x1B\[[0-?9;]*[mG]/g;

const formatTerminalMessage = (message: string, prefix: string): string => {
	try {
		const cleanPrefix = prefix.replace(ansiRegex, "");
		const maxWidth = process.stdout.columns || 80;
		const wrapWidth = Math.max(maxWidth - cleanPrefix.length - 3, 20);

		if (!padNewlines) return message;

		const wrapped = wrapAnsi(message, wrapWidth, {
			trim: true,
			hard: true,
			wordWrap: true,
		});

		return wrapped
			.split("\n")
			.map((line, index) => {
				return index === 0 ? line : `${" ".repeat(cleanPrefix.length)}${line}`;
			})
			.join("\n");
	} catch (error) {
		console.error("Error formatting terminal message:", error);
		return message;
	}
};

const levelColors: Record<LogLevel | string, ChalkInstance> = {
	error: chalk.red.bold,
	warn: chalk.yellow.bold,
	info: chalk.green.bold,
	debug: chalk.blue.bold,
	verbose: chalk.cyan.bold,
	silly: chalk.magenta.bold,
	task: chalk.cyan.bold,
	ut: chalk.hex("#9D00FF"),
};

const parseTimestamp = (timestamp: string): string => {
	const [datePart, timePart] = timestamp.split(" ");
	const [day, month] = datePart.split("/");
	const [hours, minutes, seconds] = timePart.split(":");
	const year = new Date().getFullYear();
	const date = new Date(
		year,
		Number.parseInt(month) - 1,
		Number.parseInt(day),
		Number.parseInt(hours),
		Number.parseInt(minutes),
		Number.parseInt(seconds),
	);
	return date.toISOString();
};

const handleWebSocketLog = (log: log_message) => {
	try {
		logToClients({
			...log,
			timestamp: parseTimestamp(log.timestamp),
		});
	} catch (error) {
		console.error(
			`WebSocket logging failed: ${
				error instanceof Error ? error.message : error
			}`,
		);
	}
};

const handleDatabaseLog = (log: log_message): void => {
	if (backupInProgress) {
		return;
	}
	try {
		dbFunctions.addLogEntry({
			...log,
			timestamp: parseTimestamp(log.timestamp),
		});
	} catch (error) {
		console.error(
			`Database logging failed: ${
				error instanceof Error ? error.message : error
			}`,
		);
	}
};

export const logger = createLogger({
	level: process.env.LOG_LEVEL || "debug",
	format: format.combine(
		format.timestamp({ format: "DD/MM HH:mm:ss" }),
		format((info) => {
			const stack = new Error().stack?.split("\n");
			let file = "unknown";
			let line = 0;

			if (stack) {
				for (let i = 2; i < stack.length; i++) {
					const lineStr = stack[i].trim();
					if (
						!lineStr.includes("node_modules") &&
						!lineStr.includes(path.basename(import.meta.url))
					) {
						const matches = lineStr.match(/\(?(.+):(\d+):(\d+)\)?$/);
						if (matches) {
							file = path.basename(matches[1]);
							line = Number.parseInt(matches[2], 10);
							break;
						}
					}
				}
			}
			return { ...info, file, line };
		})(),
		format.printf((info) => {
			const { timestamp, level, message, file, line } =
				info as TransformableInfo & log_message;
			let processedLevel = level as LogLevel;
			let processedMessage = String(message);

			if (processedMessage.startsWith("__task__")) {
				processedMessage = processedMessage
					.replace(/__task__/g, "")
					.trimStart();
				processedLevel = "task";
				if (processedMessage.startsWith("__db__")) {
					processedMessage = processedMessage
						.replace(/__db__/g, "")
						.trimStart();
					processedMessage = `${chalk.magenta("DB")} ${processedMessage}`;
				}
			} else if (processedMessage.startsWith("__UT__")) {
				processedMessage = processedMessage.replace(/__UT__/g, "").trimStart();
				processedLevel = "ut";
			}

			if (file.endsWith("plugin.ts")) {
				processedMessage = `[ ${chalk.grey(file)} ] ${processedMessage}`;
			}

			const paddedLevel = processedLevel.toUpperCase().padEnd(5);
			const coloredLevel = (levelColors[processedLevel] || chalk.white)(
				paddedLevel,
			);
			const coloredContext = chalk.cyan(`${file}:${line}`);
			const coloredTimestamp = chalk.yellow(timestamp);

			const prefix = `${paddedLevel} [ ${timestamp} ] - `;
			const combinedContent = `${processedMessage} - ${coloredContext}`;

			const formattedMessage = padNewlines
				? formatTerminalMessage(combinedContent, prefix)
				: combinedContent;

			handleDatabaseLog({
				level: processedLevel,
				timestamp: timestamp,
				message: processedMessage,
				file: file,
				line: line,
			});
			handleWebSocketLog({
				level: processedLevel,
				timestamp: timestamp,
				message: processedMessage,
				file: file,
				line: line,
			});

			return `${coloredLevel} [ ${coloredTimestamp} ] - ${formattedMessage}`;
		}),
	),
	transports: [new transports.Console()],
});
