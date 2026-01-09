import { Logger } from "@dockstat/logger"
import { logClients } from "./websockets/logSocket"

const BaseLogger = new Logger("DockStatAPI", [], (entry) => {
  for (const client of logClients) {
    try {
      client.send(entry, true)
    } catch (err) {
      BaseLogger.error(`Failed to send log to client - ${JSON.stringify(err)}`)
    }
  }
})

const HookLogger = BaseLogger.spawn("LogHook")

BaseLogger.setLogHook((entry) => {
  for (const client of logClients) {
    try {
      client.send(entry)
    } catch (err) {
      HookLogger.error(`Failed to send log to client - ${JSON.stringify(err)}`)
    }
  }
})
export default BaseLogger
