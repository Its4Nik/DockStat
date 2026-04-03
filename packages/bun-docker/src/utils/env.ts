import { env } from "node:process"

export const DOCKER_SOCKET = String(env.DOCKER_SOCKET ?? "/var/run/docker.sock")
export const API_PORT = Number(env.API_PORT ?? 4116)
export const API_KEYS = (env.API_KEYS ?? "").split(",")
export const ENABLE_API = Boolean(env.ENABLE_API ?? false)
export const CA_FILE = env.CA_FILE ?? null
export const CERT_FILE = env.CERT_FILE ?? null
export const KEY_FILE = env.KEY_FILE ?? null
