import type { Dispatch, SetStateAction } from "react"
import { api } from "../api"

export const rssFeedEffect = (setRamUsage: Dispatch<SetStateAction<string>>) => {
  const rssFeed = api.ws.rss.subscribe()

  rssFeed.subscribe((message) => {
    setRamUsage(message.data)
  })

  return () => {
    rssFeed.close()
  }
}
