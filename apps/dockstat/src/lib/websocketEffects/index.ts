export * from "./logFeed"
export * from "./rssFeed"

import { useEffect, useState } from "react";
import {api, getAuthHeaders} from "../api.ts"
import { useGeneralSettings } from "@/components/settings/general/sections/useGeneralSettings";

const useWebSocket = () => {
  const settings = useGeneralSettings()
  const [wsData, setWsData] = useState()

  useEffect(() => {
    const ws = api.ws.subscribe({ headers: getAuthHeaders() })
    ws.subscribe((msg) => {
      setWsData(JSON.parse(String(msg.data)))
    })
  }, [])

  return {
    wsData,
    onUnmount: () =>
  }
}
