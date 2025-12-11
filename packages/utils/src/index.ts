import * as HTTP_RequestID from "./http/RequestId"
import * as buildMessage from "./worker/buildMessage"

export const worker = {
  buildMessage: buildMessage,
}

export const truncate = (str: string, max: number) =>
  str.length > max ? `${str.slice(0, max)}...` : str

export const http = {
  requestId: HTTP_RequestID,
}
