import type DockerClient from "@dockstat/docker-client"
import { createLogger } from "@dockstat/logger"
import type { DB_target_host } from "@dockstat/typings"
import { clientLogger as logger } from "~/root"

export async function startUp(
  toRun: Record<
    string,
    {
      steps?: Array<() => void>
      asyncSteps?: Array<() => Promise<void>>
    }
  >
) {
  const startUpLogger = createLogger("DockStat-Init")
  const entries = Object.entries(toRun)

  startUpLogger.info("=".repeat(20))
  startUpLogger.info("/".repeat(10))
  startUpLogger.info(`🚀 Running ${entries.length} steps`)
  startUpLogger.info(
    `⌛ Async Steps: ${entries.filter(([, t]) => (t.asyncSteps?.length ?? 0) > 0).length}`
  )
  startUpLogger.info(
    `⌛ Sync Steps: ${entries.filter(([, t]) => (t.steps?.length ?? 0) > 0).length}`
  )

  for (const [taskName, tasks] of entries) {
    startUpLogger.info("=".repeat(20))
    startUpLogger.info("/".repeat(10))
    startUpLogger.info(`▶️ Running Step: ${taskName}`)

    // Run sync steps
    if (tasks.steps?.length) {
      for (const [i, step] of tasks.steps.entries()) {
        startUpLogger.debug(`Starting sync step ${i + 1} for ${taskName}`);
        try {
          step()
          startUpLogger.info(`✅ Step ${i + 1}/${tasks.steps.length} completed`)
        } catch (err) {
          startUpLogger.error(
            `❌ Step ${i + 1} failed in ${taskName}: ${(err as Error).message}`
          )
          startUpLogger.debug(`Error stack: ${(err as Error).stack}`);
        }
      }
    }

    // Run async steps
    if (tasks.asyncSteps?.length) {
      for (const [i, step] of tasks.asyncSteps.entries()) {
        startUpLogger.debug(`Starting async step ${i + 1} for ${taskName}`);
        try {
          await step()
          startUpLogger.info(
            `✅ Async Step ${i + 1}/${tasks.asyncSteps.length} completed`
          )
        } catch (err) {
          startUpLogger.error(
            `❌ Async Step ${i + 1} failed in ${taskName}: ${(err as Error).message}`
          )
          startUpLogger.debug(`Error stack: ${(err as Error).stack}`);
        }
      }
    }

    startUpLogger.info(`✔️ Finished ${taskName}`)
  }

  startUpLogger.info("🎉 All tasks complete!")
}

export function injectVariables(variables: Record<string, string>, docRoot: HTMLElement): void {
  logger.info(`Injecting variables : ${Object.keys(variables).join(", ")}`)
  logger.debug(`Variables: ${JSON.stringify(variables)}`);
  for (const [key, value] of Object.entries(variables)) {
    logger.debug(`Injecting variable: ${key} with value: ${value}`);
    try {
      injectSingleCSSVar(key,value, docRoot)
      logger.info(`Injected variable: ${key}`);
    } catch (err) {
      logger.error(`Failed to inject variable ${key}: ${err}`);
    }
  }
}

function injectSingleCSSVar(variable: string, value: string, docRoot: HTMLElement): string {
  logger.info(`Injecting ${variable} with value: ${value}`)
  const startsWithHyphen = variable.startsWith("--")
  logger.debug(`${startsWithHyphen ? "Parsed variable with Hyphen" : "Parsed variable without Hyphens, added \"--\""}`)
  const cssVar = startsWithHyphen ? variable : `--${variable}`;
  try {
    docRoot.style.setProperty(cssVar, value);
    logger.debug(`Set CSS variable ${cssVar} on docRoot`);
  } catch (err) {
    logger.error(`Failed to set CSS variable ${cssVar}: ${err}`);
  }
  return value;
}

export function getHostObjectFromForm(form: FormData, setId = false){
  const host: DB_target_host = {
    id: setId ? Number.parseInt(String(form.get('id'))) : 0,
    host: String(form.get('host')),
    port: Number.parseInt(String(form.get('port'))),
    secure: Boolean(String(form.get('secure'))),
    name: String(form.get('name')),
  }

  return host
}

export function getDockerClientFromAdapterID(DOA: [string, DockerClient][], form: FormData){
  const aID = String(form.get('adapterID'))
  const AOBJ = DOA.find(([id]) => id === aID)
  if(!AOBJ) {throw new Error(`Adapter ID ${aID} not found`)}
  const [id, client] = AOBJ

  return {id: id, client: client}
}
