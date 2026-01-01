import { api } from "../api"

export const rssFeedEffect = (setRamUsage: React.Dispatch<React.SetStateAction<string>>) => {
  const rssFeed = api.api.v2.misc.stats.rss.subscribe()

  rssFeed.subscribe((message) => {
    setRamUsage(message.data)
  })

  return () => {
    rssFeed.close()
  }
}
