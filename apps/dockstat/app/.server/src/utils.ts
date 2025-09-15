import { createLogger } from "@dockstat/logger"
const startUpLogger = createLogger("DockStat-Init")

export async function startUp(
  toRun: Record<
    string,
    {
      steps?: Array<() => void>
      asyncSteps?: Array<() => Promise<void>>
    }
  >
) {
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
        try {
          step()
          startUpLogger.info(`✅ Step ${i + 1}/${tasks.steps.length} completed`)
        } catch (err) {
          startUpLogger.error(
            `❌ Step ${i + 1} failed in ${taskName}: ${(err as Error).message}`
          )
        }
      }
    }

    // Run async steps
    if (tasks.asyncSteps?.length) {
      for (const [i, step] of tasks.asyncSteps.entries()) {
        try {
          await step()
          startUpLogger.info(
            `✅ Async Step ${i + 1}/${tasks.asyncSteps.length} completed`
          )
        } catch (err) {
          startUpLogger.error(
            `❌ Async Step ${i + 1} failed in ${taskName}: ${(err as Error).message}`
          )
        }
      }
    }

    startUpLogger.info(`✔️ Finished ${taskName}`)
  }

  startUpLogger.info("🎉 All tasks complete!")
}
