import { useEdenClient } from "@dockstat/utils/react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useLocalAuthCheck() {
  const eden = useEdenClient()
  const [shouldRun, setShouldRun] = useState(false)
  const [exists, setExists] = useState(false)
  const [checking, setChecking] = useState(true)
  const [allowRegistration, setAllowRegistration] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await eden.call(api.auth.local.exists.get, { skipAuthHandler: true })
        if (data) {
          setExists((data as { exists?: boolean }).exists ?? false)
        }
      } catch (err) {
        console.error("Failed to check local users:", err)
        setExists(false)
      } finally {
        setChecking(false)
      }
    }

    const isGuestUserRegistrationEnabled = async () => {
      try {
        const { data } = await eden.call(api.auth.local["allow-guest"].get, {
          skipAuthHandler: true,
        })
        if (data) {
          setAllowRegistration(data as boolean)
        }
      } catch (err) {
        console.error("Failed to check if guest registration is enabled:", err)
        setAllowRegistration(false)
      }
    }

    if (shouldRun) {
      check()
      isGuestUserRegistrationEnabled()

      setShouldRun(false)
    }
  }, [shouldRun, eden])

  useEffect(() => {
    setShouldRun(true)
  }, [])

  return { allowRegistration, checking, exists, setShouldRun }
}
