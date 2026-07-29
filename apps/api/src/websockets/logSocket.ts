import { memoryUsage } from "bun:jsc"
import { formatBytes } from "@dockstat/utils"
import BaseLogger from "../logger"
import { DSWebSockerHandler } from "."

const interval = 5_000

const sendRss = () => {
  const usage = formatBytes(memoryUsage().current)
  DSWebSockerHandler.send("rss", usage)
}

export const startRss = () => setInterval(sendRss, interval)
