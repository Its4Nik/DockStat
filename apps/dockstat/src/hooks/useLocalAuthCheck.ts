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
    if (!shouldRun) return
    let cancelled = false

    const check = async () => {
      try {
        const { data } = await eden.call(api.auth.local.exists.get, { skipAuthHandler: true })
        if (cancelled) return
        if (data) {
          setExists((data as { exists?: boolean }).exists ?? false)
        }
      } catch (err) {
        if (cancelled) return
        console.error("Failed to check local users:", err)
        setExists(false)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    const isGuestUserRegistrationEnabled = async () => {
      try {
        const { data } = await eden.call(api.auth.local["allow-guest"].get, {
          skipAuthHandler: true,
        })
        if (cancelled) return
        if (data) {
          setAllowRegistration(data as boolean)
        }
      } catch (err) {
        if (cancelled) return
        console.error("Failed to check if guest registration is enabled:", err)
        setAllowRegistration(false)
      }
    }

    // Independent checks — run in parallel, each with its own error handling.
    void Promise.allSettled([check(), isGuestUserRegistrationEnabled()])
    setShouldRun(false)

    return () => {
      cancelled = true
    }
  }, [shouldRun, eden])

  useEffect(() => {
    setShouldRun(true)
  }, [])

  return { allowRegistration, checking, exists, setShouldRun }
}
