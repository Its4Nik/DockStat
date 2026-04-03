import { SocketHandler } from "./socket"
import {
  API_KEYS as API_KEYS_ENV,
  API_PORT as API_PORT_ENV,
  CA_FILE as CA_FILE_ENV,
  CERT_FILE as CERT_FILE_ENV,
  DOCKER_SOCKET as DOCKER_SOCKET_ENV,
  ENABLE_API as ENABLE_API_ENV,
  KEY_FILE as KEY_FILE_ENV,
} from "./utils/env"

export namespace BunDocker {
  export const DOCKER_SOCKET = DOCKER_SOCKET_ENV
  export const API_KEYS = API_KEYS_ENV
  export const API_PORT = API_PORT_ENV
  export const ENABLE_API = ENABLE_API_ENV
  export const CA_FILE = CA_FILE_ENV
  export const CERT_FILE = CERT_FILE_ENV
  export const KEY_FILE = KEY_FILE_ENV
  export const TLS_ACTIVE = Boolean(CERT_FILE && KEY_FILE)

  export const Docker = SocketHandler
}
