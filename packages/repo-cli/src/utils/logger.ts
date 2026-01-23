// cli/utils/logger.ts
export function log(icon: string, message: string, detail?: string) {
  const detailStr = detail ? ` → ${detail}` : ""
  console.log(`${icon} ${message}${detailStr}`)
}

export function logError(title: string, error: unknown) {
  console.error(`\n${"=".repeat(70)}`)
  console.error(`❌ ${title}`)
  console.error("=".repeat(70))

  if (error instanceof AggregateError) {
    console.error(`\nBuild errors (${error.errors.length}):`)
    for (const err of error.errors) {
      if (err && typeof err === "object") {
        const buildErr = err as {
          message?: string
          position?: { file?: string; line?: number; column?: number }
          level?: string
        }
        const pos = buildErr.position
        const location = pos ? `${pos.file || "unknown"}:${pos.line || 0}:${pos.column || 0}` : ""
        console.error(`  - [${buildErr.level || "error"}] ${buildErr.message || String(err)}`)
        if (location) console.error(`    at ${location}`)
      } else {
        console.error(`  - ${String(err)}`)
      }
    }
  } else if (error instanceof Error) {
    console.error(`\nMessage: ${error.message}`)
    if (error.cause) console.error(`Cause: ${JSON.stringify(error.cause, null, 2)}`)
    if (error.stack) console.error(`\nStack:\n${error.stack}`)
  } else {
    console.error(String(error))
  }

  console.error(`\n${"=".repeat(70)}\n`)
}

export function printSummary(succeeded: number, failed: number) {
  console.log(`\n${"=".repeat(50)}`)
  console.log(`📊 Summary: ${succeeded} succeeded, ${failed} failed`)
  console.log("=".repeat(50))
}
