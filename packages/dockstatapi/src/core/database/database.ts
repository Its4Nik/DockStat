import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { userInfo } from "node:os";
import path from "node:path";

const dataFolder = path.join(process.cwd(), "data");

const username = userInfo().username;
const gid = userInfo().gid;
const uid = userInfo().uid;

export let db: Database;

try {
	const databasePath = path.join(dataFolder, "dockstatapi.db");
	console.log("Database path:", databasePath);
	console.log(`Running as: ${username} (${uid}:${gid})`);

	if (!existsSync(dataFolder)) {
		await mkdir(dataFolder, { recursive: true, mode: 0o777 });
		console.log("Created data directory:", dataFolder);
	}

	db = new Database(databasePath, { create: true });
	console.log("Database opened successfully");

	db.exec("PRAGMA journal_mode = WAL;");
} catch (error) {
	console.error(`Cannot start DockStatAPI: ${error}`);
	process.exit(500);
}

export function init() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS backend_log_entries (
      timestamp STRING NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      file TEXT NOT NULL,
      line NUMBER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stacks_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version INTEGER NOT NULL,
      custom BOOLEAN NOT NULL,
      source TEXT NOT NULL,
      compose_spec TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS docker_hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hostAddress TEXT NOT NULL,
      secure BOOLEAN NOT NULL
    );

    CREATE TABLE IF NOT EXISTS host_stats (
      hostId INTEGER NOT NULL,
      hostName TEXT NOT NULL,
      dockerVersion TEXT NOT NULL,
      apiVersion TEXT NOT NULL,
      os TEXT NOT NULL,
      architecture TEXT NOT NULL,
      totalMemory INTEGER NOT NULL,
      totalCPU INTEGER NOT NULL,
      labels TEXT NOT NULL,
      containers INTEGER NOT NULL,
      containersRunning INTEGER NOT NULL,
      containersStopped INTEGER NOT NULL,
      containersPaused INTEGER NOT NULL,
      images INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS container_stats (
      id TEXT NOT NULL,
      hostId TEXT NOT NULL,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      status TEXT NOT NULL,
      state TEXT NOT NULL,
      cpu_usage FLOAT NOT NULL,
      memory_usage FLOAT NOT NULL,
      network_rx_rate NUMBER NOT NULL,
      network_tx_rate NUMBER NOT NULL,
      network_rx_bytes NUMBER NOT NULL,
      network_tx_bytes NUMBER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS config (
      keep_data_for NUMBER NOT NULL,
      fetching_interval NUMBER NOT NULL    );

    CREATE TABLE IF NOT EXISTS store_repos (
      slug TEXT NOT NULL,
      base TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS themes (
      name TEXT PRIMARY KEY,
      creator TEXT NOT NULL,
      vars TEXT NOT NULL,
      options TEXT NOT NULL,
      tags TEXT NOT NULL
    )
  `);

	const themeRows = db
		.prepare("SELECT COUNT(*) AS count FROM themes")
		.get() as { count: number };

	const defaultCss = `
    .root,
    #root,
    #docs-root {
      --accent: #818cf9;
      --muted-bg: #0f172a;
      --gradient-from: #1e293b;
      --gradient-to: #334155;
      --border: #334155;
      --border-accent: #818cf94d;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-tertiary: #64748b;
      --state-success: #4ade80;
      --state-warning: #facc15;
      --state-error: #f87171;
      --state-info: #38bdf8;
      --shadow-glow: 0 0 15px #818cf980;
      --background-gradient: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
    }
  `;

	const defaultThemeOptions = {
		backgroundAnimation: {
			enabled: true,
			from: ["#c084fc", "#818cf9", "#60a5fa"],
		},
	};

	if (themeRows.count === 0) {
		db.prepare(
			"INSERT INTO themes (name, creator, vars, options, tags) VALUES (?,?,?,?,?)",
		).run(
			"default",
			"Its4Nik",
			defaultCss,
			JSON.stringify(defaultThemeOptions),
			"default, dark",
		);
	}

	const configRow = db
		.prepare("SELECT COUNT(*) AS count FROM config")
		.get() as { count: number };

	if (configRow.count === 0) {
		db.prepare(
			"INSERT INTO config (keep_data_for, fetching_interval) VALUES (7, 5)",
		).run();
	}

	const hostRow = db
		.prepare("SELECT COUNT(*) AS count FROM docker_hosts")
		.get() as { count: number };

	if (hostRow.count === 0) {
		db.prepare(
			"INSERT INTO docker_hosts (name, hostAddress, secure) VALUES (?, ?, ?)",
		).run("Localhost", "localhost:2375", false);
	}

	const storeRow = db
		.prepare("SELECT COUNT(*) AS count FROM store_repos")
		.get() as { count: number };

	if (storeRow.count === 0) {
		db.prepare("INSERT INTO store_repos (slug, base) VALUES (?, ?)").run(
			"DockStacks",
			"https://raw.githubusercontent.com/Its4Nik/DockStacks/refs/heads/main/Index.json",
		);
	}
}

init();
