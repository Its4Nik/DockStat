export const cleanReqId = (reqId: string) => {
  if (isProxied(reqId)) {
    const c = reqId.split("|")[0] || ""
    return c
  }
  return reqId
}

export const getRequestID = (isProxy = false, isTreaty = false) => {
  let id = ""
  if (isProxy) {
    id = `${Bun.randomUUIDv7().split("-")[4]}|RR-Proxy`
  } else if (isTreaty) {
    id = `${Bun.randomUUIDv7().split("-")[4]}|treaty`
  } else {
    id = `${Bun.randomUUIDv7().split("-")[4]}`
  }

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
  return is
}
