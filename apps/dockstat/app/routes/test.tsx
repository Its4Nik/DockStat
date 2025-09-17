import type { DOCKER } from "@dockstat/typings";
import { Rocket } from "lucide-react";
import {
  Form,
  useLoaderData,
  useActionData,
  type ActionFunctionArgs,
} from "react-router";
import ServerInstance from "~/.server";
import { clientLogger } from "~/root";

/* ------------------------------- ACTION ------------------------------- */
export async function action({ request }: ActionFunctionArgs) {
  const logger = ServerInstance.logger
  const startTime = Date.now();
  let intent = "";

  try {
    const form = await request.formData();
    intent = String(form.get("intent") ?? "");
    const adapterId = String(form.get("adapterId") ?? "");

    logger.info(`Processing action: ${intent}, ${adapterId}`);

    const AH = ServerInstance.getAdapterHandler()
    const dockerAdapters = AH.getDockerAdapters();

    if (intent !=="add-adapter"){
    if (intent !== "add-client") {
      if (!adapterId) {
        logger.warn(`No adapterId provided for intent: ${intent}`);
        return { error: "Client ID is required for this operation." };
      }

      const dockerAdapter = dockerAdapters[Number(adapterId)];
      if (!dockerAdapter) {
        logger.error(`Docker adapter not found: ${adapterId}, availableAdapters: ${Object.keys(dockerAdapters).join(', ')}`);
        return { error: `Docker adapter "${adapterId}" not found. Available adapters: ${Object.keys(dockerAdapters).join(', ')}` };
      }
    }}

    switch (intent) {
      case "test-connectivity": {
        const dockerAdapter = dockerAdapters[Number(adapterId)];
        logger.debug(`Testing connectivity for client ${adapterId}`);

        const stats = await dockerAdapter.ping();
        logger.info(`Connectivity test successful, Adapter=${adapterId} Reachable=${stats.reachableInstances.join(",")} Unreachable=${stats.unreachableInstances.join(",")}`);

        return { intent, ok: true, stats };
      }

      case "get-all-stats": {
        const dockerAdapter = dockerAdapters[Number(adapterId)];
        logger.debug(`Getting all stats for client ${adapterId}`);

        const allStats = await dockerAdapter.getAllStats();
        logger.info(`Stats retrieval successful ${adapterId}, statCount: ${allStats.containerStats.length + allStats.hostMetrics.length}`);

        return { intent, ok: true, allStats };
      }

      case "add-adapter": {
        const name = String(form.get("name") ?? "").trim();
        const defaultTimeout = Number(form.get("defaultTimeout") ?? 10000);
        const enableEventEmitter = form.get("enableEventEmitter") === "on";
        const enableMonitoring = form.get("enableMonitoring") === "on";
        const retryAttempts = Number(form.get("retryAttempts") ?? 3);
        const retryDelay = Number(form.get("retryDelay") ?? 1000);

        if (!name) {
          logger.warn("Attempt to add client without name");
          return { intent, ok: false, error: "Name is required" };
        }

        // Validate numeric inputs
        if (Number.isNaN(defaultTimeout) || defaultTimeout < 0) {
          logger.warn(`Invalid defaultTimeout value: ${defaultTimeout}`);
          return { intent, ok: false, error: "Invalid default timeout value" };
        }

        if (Number.isNaN(retryAttempts) || retryAttempts < 0) {
          logger.warn(`Invalid retryAttempts value: ${retryAttempts}`);
          return { intent, ok: false, error: "Invalid retry attempts value" };
        }

        if (Number.isNaN(retryDelay) || retryDelay < 0) {
          logger.warn(`Invalid retryDelay value: ${retryDelay}`);
          return { intent, ok: false, error: "Invalid retry delay value" };
        }

        // execOptions fields
        const exec_workingDir = String(form.get("exec_workingDir") ?? "").trim();
        const exec_env_raw = String(form.get("exec_env") ?? "").trim();
        const exec_tty = form.get("exec_tty") === "on";

        // monitoringOptions fields
        const mon_healthCheckInterval = form.get("monitoring_healthCheckInterval");
        const mon_containerEventPollingInterval = form.get(
          "monitoring_containerEventPollingInterval"
        );
        const mon_hostMetricsInterval = form.get("monitoring_hostMetricsInterval");
        const mon_enableContainerEvents =
          form.get("monitoring_enableContainerEvents") === "on";
        const mon_enableHostMetrics = form.get("monitoring_enableHostMetrics") === "on";
        const mon_enableHealthChecks =
          form.get("monitoring_enableHealthChecks") === "on";

        const exec_env =
          exec_env_raw === ""
            ? undefined
            : exec_env_raw
                .split(/\r?\n|,/)
                .map((s) => s.trim())
                .filter(Boolean);

        const execOptions: DOCKER.ExecOptions = {};
        if (exec_workingDir) execOptions.workingDir = exec_workingDir;
        if (exec_env) execOptions.env = exec_env;
        execOptions.tty = !!exec_tty;

        const monitoringOptions: DOCKER.MonitoringOptions = {};

        // Validate and set monitoring options with proper error handling
        try {
          if (mon_healthCheckInterval && String(mon_healthCheckInterval).trim() !== "") {
            const value = Number(mon_healthCheckInterval);
            if (Number.isNaN(value) || value < 0) throw new Error("Invalid healthCheckInterval");
            monitoringOptions.healthCheckInterval = value;
          }

          if (mon_containerEventPollingInterval && String(mon_containerEventPollingInterval).trim() !== "") {
            const value = Number(mon_containerEventPollingInterval);
            if (Number.isNaN(value) || value < 0) throw new Error("Invalid containerEventPollingInterval");
            monitoringOptions.containerEventPollingInterval = value;
          }

          if (mon_hostMetricsInterval && String(mon_hostMetricsInterval).trim() !== "") {
            const value = Number(mon_hostMetricsInterval);
            if (Number.isNaN(value) || value < 0) throw new Error("Invalid hostMetricsInterval");
            monitoringOptions.hostMetricsInterval = value;
          }
        } catch (error) {
          logger.error(`Invalid monitoring option value: ${error}`);
          return { intent, ok: false, error: `Invalid monitoring option: ${error}` };
        }

        monitoringOptions.enableContainerEvents = !!mon_enableContainerEvents;
        monitoringOptions.enableHostMetrics = !!mon_enableHostMetrics;
        monitoringOptions.enableHealthChecks = !!mon_enableHealthChecks;

        try {
          ServerInstance.getAdapterHandler().registerDockerAdapter(name, {
            defaultTimeout,
            enableEventEmitter,
            enableMonitoring,
            execOptions,
            monitoringOptions,
            retryAttempts,
            retryDelay,
          });

          logger.info(`Docker client registered successfully: ${ name }`);
          return { intent, ok: true, message: `Client "${name}" registered` };
        } catch (error) {
          logger.error(`Failed to register docker client (${name}): ${error}`);
          return { intent, ok: false, error: `Failed to register client: ${error}` };
        }
      }

      case "add-host": {
        const dockerAdapter = dockerAdapters[Number(adapterId)];
        const url = String(form.get("url") ?? "");
        const name = String(form.get("name") ?? "");
        const secureRaw = form.get("secure");
        const secure = secureRaw === "on" || secureRaw === "true";
        const portRaw = form.get("port");
        const port = portRaw ? Number(portRaw) : undefined;

        if (!url) {
          logger.warn("Attempt to add host without URL");
          return { intent, ok: false, error: "URL is required" };
        }

        if(!name) {
          logger.warn("Attempt to add host without name");
          return { intent, ok: false, error: "Name is required" };
        }

        if(!port) {
          logger.warn("Attempt to add host without port");
          return { intent, ok: false, error: "Port is required" };
        }

        try {
          const host = dockerAdapter.addHost(url, name, secure, port);
          logger.debug(`Host added, checking health for Host ${host.id}`);

          const isReachable = await dockerAdapter.checkHostHealth(host.id);
          logger.info(`Host health check completed for Host ${host.id}: ${isReachable ? "reachable" : "unreachable"}`);

          return { intent, ok: true, host: { id: host.id, isReachable } };
        } catch (error) {
          logger.error(`Failed to add host: ${JSON.stringify({ error, url, name })}`);
          return { intent, ok: false, error: `Failed to add host: ${error}` };
        }
      }

      case "check-host-health": {
        const dockerAdapter = dockerAdapters[Number(adapterId)];
        const hostId = String(form.get("hostId") ?? "");

        if (!hostId) {
          logger.warn("Attempt to check host health without hostId");
          return { intent, ok: false, error: "hostId required" };
        }

        try {
          const isReachable = await dockerAdapter.checkHostHealth(Number(hostId));
          logger.info(`Host health check completed for Host ${hostId}: ${isReachable ? "reachable" : "unreachable"}`);

          return { intent, ok: true, hostId, isReachable };
        } catch (error) {
          logger.error(`Failed to check host health for Host ${hostId}: ${error}`);
          return { intent, ok: false, error: `Failed to check host health: ${error}` };
        }
      }

      default:
        logger.warn(`Unknown intent received: ${intent}`);
        return { error: `Unknown intent: ${intent}` };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Action processing failed: ${errorMessage}, intent: ${intent}, stack: ${error instanceof Error ? error.stack : undefined}`);

    return {
      intent,
      ok: false,
      error: `Internal server error: ${errorMessage}`
    };
  } finally {
    const duration = Date.now() - startTime;
    logger.debug(`Action ${intent} completed in ${duration}ms`);
  }
}

/* ------------------------------- LOADER ------------------------------- */
export function loader() {
  try {
    clientLogger.info("Loading test route data");

    const DBSchema = ServerInstance.getDB().DB.getSchema();
    const AdapterTable = ServerInstance.getDB().tables.adapter.select(["*"]).all();
    clientLogger.debug("Loader completed successfully");

    return {
        adapters: AdapterTable,
        schema: DBSchema,
    };
  } catch (error) {
    clientLogger.error(`Loader failed: ${error}`);

    return {
      adapters: [],
      schema: null,
      error: "Failed to load data"
    };
  }
}

/* ------------------------------- UI ------------------------------- */
export default function TestRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const DockerAdapters = loaderData.adapters.filter(adapter => adapter.type === 'docker') ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Docker Connectivity — Tester
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Quick diagnostics for your adapter clients & hosts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-700/60 text-sm">
              <span className="text-slate-300">Adapters</span>
              <span className="inline-block bg-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                {loaderData.adapters.length}
              </span>
            </span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm shadow"
              title="Refresh"
            >
              <Rocket /> Refresh
            </button>
          </div>
        </header>

        {/* Error banner for loader errors */}
        {loaderData.error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-400 font-medium">Load Error:</span>
              <span className="ml-2 text-red-300">{loaderData.error}</span>
            </div>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel: Controls (left column) */}
          <section className="lg:col-span-1 bg-slate-900/70 border border-slate-700 rounded-xl p-6 shadow-md space-y-6">
            <h2 className="text-lg font-medium">Create Docker Adapter</h2>

            {/* Create Adapter Form */}
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="add-adapter" />

              <label className="block text-sm">
                <span className="text-slate-300">Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Adapter Name"
                  className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">
                  <span className="text-slate-300">Default timeout (ms)</span>
                  <input
                    type="number"
                    name="defaultTimeout"
                    defaultValue={10000}
                    min={0}
                    className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-300">Retry attempts</span>
                  <input
                    type="number"
                    name="retryAttempts"
                    defaultValue={3}
                    min={0}
                    className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-300">Retry delay (ms)</span>
                  <input
                    type="number"
                    name="retryDelay"
                    defaultValue={1000}
                    min={0}
                    className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-300">Enable monitoring</span>
                  <div className="mt-2">
                    <input name="enableMonitoring" type="checkbox" className="w-4 h-4" />
                  </div>
                </label>

                <label className="text-sm">
                  <span className="text-slate-300">Enable event emitter</span>
                  <div className="mt-2">
                    <input name="enableEventEmitter" type="checkbox" className="w-4 h-4" />
                  </div>
                </label>
              </div>

              {/* Exec options */}
              <div className="pt-2">
                <h4 className="text-sm font-medium text-slate-200">execOptions</h4>
                <label className="block text-sm mt-2">
                  <span className="text-slate-300">workingDir</span>
                  <input
                    name="exec_workingDir"
                    placeholder="/work/dir"
                    className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  />
                </label>

                <label className="block text-sm mt-2">
                  <span className="text-slate-300">env (one per line or comma separated)</span>
                  <textarea
                    name="exec_env"
                    placeholder={"KEY=value\nOTHER=foo"}
                    className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm min-h-[80px] font-mono"
                  />
                </label>

                <label className="flex items-center gap-3 mt-2 text-sm">
                  <input name="exec_tty" type="checkbox" className="w-4 h-4" />
                  <span className="text-slate-300">tty</span>
                </label>
              </div>

              {/* Monitoring options */}
              <div className="pt-2">
                <h4 className="text-sm font-medium text-slate-200">monitoringOptions</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <label className="text-sm">
                    <span className="text-slate-300">healthCheckInterval (ms)</span>
                    <input
                      name="monitoring_healthCheckInterval"
                      type="number"
                      placeholder="e.g. 5000"
                      className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                      min={0}
                    />
                  </label>

                  <label className="text-sm">
                    <span className="text-slate-300">containerEventPollingInterval (ms)</span>
                    <input
                      name="monitoring_containerEventPollingInterval"
                      type="number"
                      placeholder="e.g. 2000"
                      className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                      min={0}
                    />
                  </label>

                  <label className="text-sm">
                    <span className="text-slate-300">hostMetricsInterval (ms)</span>
                    <input
                      name="monitoring_hostMetricsInterval"
                      type="number"
                      placeholder="e.g. 10000"
                      className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                      min={0}
                    />
                  </label>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        name="monitoring_enableContainerEvents"
                        type="checkbox"
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">enableContainerEvents</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        name="monitoring_enableHostMetrics"
                        type="checkbox"
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">enableHostMetrics</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        name="monitoring_enableHealthChecks"
                        type="checkbox"
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">enableHealthChecks</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium"
                >
                  Create Adapter
                </button>

                <button
                  type="reset"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm"
                >
                  Reset
                </button>
              </div>

              {actionData?.intent === "add-adapter" && (
                <div
                  className={`mt-2 text-sm p-2 rounded ${
                    actionData.ok ? "bg-emerald-900/30 text-emerald-300" : "bg-amber-900/30 text-amber-300"
                  }`}
                >
                  {actionData.ok ? actionData.message ?? "Adapter created" : actionData.error}
                </div>
              )}
            </Form>

            {/* Divider */}
            <div className="border-t border-slate-700" />

            {/* Add Host Form */}
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="add-host" />

              <h3 className="text-lg font-medium">Add Docker Host</h3>

              <label className="block text-sm">
                <span className="text-slate-300">Select Adapter</span>
                <select
                  name="adapterId"
                  className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  required
                >
                  {DockerAdapters.map((Adapter) => (
                    <option key={Adapter.id} value={String(Adapter.id)}>
                      {Adapter.id} — {Adapter.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-slate-300">Host URL</span>
                <input
                  type="text"
                  name="url"
                  placeholder="tcp://hostname.or.ip"
                  className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate-300">Host Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Host display name"
                  className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">
                  <span className="text-slate-300">Port</span>
                  <input
                    type="number"
                    name="port"
                    placeholder="2375"
                    className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    required
                  />
                </label>

                <label className="flex items-center gap-3 text-sm mt-6">
                  <input name="secure" type="checkbox" className="w-4 h-4" />
                  <span className="text-slate-300">Secure (TLS)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-medium"
              >
                Add Host
              </button>

              {actionData?.intent === "add-host" && (
                <div
                  className={`text-sm p-2 rounded ${
                    actionData.ok ? "bg-emerald-900/30 text-emerald-300" : "bg-amber-900/30 text-amber-300"
                  }`}
                >
                  {actionData.ok ? `Host added successfully (ID: ${actionData.host?.id})` : actionData.error}
                </div>
              )}
            </Form>

            {/* Divider */}
            <div className="border-t border-slate-700" />

            {/* Select client and run tests (keeps previous UI) */}
            <Form method="post" className="space-y-4">
              <label className="block text-sm">
                <span className="text-slate-300">Select Docker Client</span>
                <select
                  name="adapterId"
                  defaultValue={DockerAdapters.length > 0 ? "0" : ""}
                  className="mt-2 block w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DockerAdapters.map((Adapter) => (
                    <option key={Adapter.id} value={String(Adapter.id)}>
                      {Adapter.id} — {Adapter.name}
                    </option>
                  ))}
                  {DockerAdapters.length === 0 && <option value="">(no clients available)</option>}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  name="intent"
                  value="test-connectivity"
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium"
                >
                  Test connectivity
                </button>

                <button
                  name="intent"
                  value="get-all-stats"
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Get all stats
                </button>
              </div>
            </Form>
          </section>

          {/* Panel: Live Preview / Info (right column) */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium">Loader data</h3>
                <div className="text-sm text-slate-400">raw</div>
              </div>

              <div className="mt-3 bg-slate-800 rounded-md p-4 overflow-auto max-h-60">
                <pre className="text-xs leading-tight whitespace-pre-wrap">
                  {JSON.stringify(loaderData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium">Last action result</h3>
                <div
                  className={`text-sm font-medium ${
                    actionData?.ok ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {actionData ? (actionData.ok ? "Success" : "Error") : ""}
                </div>
              </div>

              <div className="mt-3 bg-slate-800 rounded-md p-4 overflow-auto max-h-72">
                <pre className="text-xs leading-tight whitespace-pre-wrap">
                  {actionData ? JSON.stringify(actionData, null, 2) : "No action yet"}
                </pre>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-200">Quick tips</h4>
                <ul className="mt-2 text-sm text-slate-300 space-y-1 list-inside list-disc">
                  <li>Use the client selector to target a specific adapter instance.</li>
                  <li>“Test connectivity” runs the same getAllStats call — useful for smoke tests.</li>
                  <li>Check host health after adding to confirm reachability.</li>
                </ul>
              </div>

              <div className="w-80 bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-200">Shortcuts</h4>
                <div className="mt-2 text-sm text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-500" />
                    <span>Test connectivity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded bg-indigo-600" />
                    <span>Get stats</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
