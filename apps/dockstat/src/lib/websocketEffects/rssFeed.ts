import { api } from "../api"

export const rssFeedEffect = (setRamUsage: React.Dispatch<React.SetStateAction<string>>) => {
  const usub = api.api.v2.misc.stats.rss.subscribe()

  usub.subscribe((message) => {
    setRamUsage(message.data)
  })

  return () => {
    usub.close()
  }
}
