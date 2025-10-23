import Logger from "@dockstat/logger"
import HTTPLogger from "./_logger"

const requestLogger = new Logger("RequestID", HTTPLogger.getParentsForLoggerChaining())

export const cleanReqId = (reqId: string) => {
  if (isProxied(reqId)) {
    const c = reqId.split("|")[0] || ""
    requestLogger.debug(`Cleaned: ${reqId} -> ${c}`, reqId)
    return c
  }
  return reqId
}

export const getRequestID = (isProxy = false, isTreaty = false) => {
  let id = ""
  if (isProxy) {
    id = `${Bun.randomUUIDv7().split('-')[4]}|RR-Proxy`
  } else if (isTreaty) {
    id = `${Bun.randomUUIDv7().split('-')[4]}|treaty`
  } else {
    id = `${Bun.randomUUIDv7().split("-")[4]}`
  }

  requestLogger.info("Generated RequestID", id)
  return id
}

export const isTreaty = (reqId: string) => {
  if (reqId === "treaty") {
    return true
  }
  if (reqId.endsWith("|treaty")) {
    return true
  }
  return false
}

export const isProxied = (reqId: string) => {
  const is = reqId.endsWith("|RR-Proxy")
  requestLogger.debug(`Is a proxied request: ${is}`, reqId)
  return is
}
