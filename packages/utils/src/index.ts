import * as HTTP_RequestID from "./http/RequestId"
import * as buildMessage from "./worker/buildMessage"

export const worker = {
	buildMessage: buildMessage,
}

export const http = {
	requestId: HTTP_RequestID,
}
