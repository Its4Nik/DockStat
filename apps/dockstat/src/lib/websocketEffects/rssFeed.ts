import type { Dispatch, SetStateAction } from "react"
import { createTopicSubscription } from "./topicSubscription"

export const rssFeedEffect = (setRamUsage: Dispatch<SetStateAction<string>>) => {
  return createTopicSubscription<string>("metrics/containers", (data) => {
    setRamUsage(data)
  })
}
