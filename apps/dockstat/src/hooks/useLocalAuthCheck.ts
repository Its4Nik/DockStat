import { useEffect, useState } from "react"
import { api, getAuthHeaders } from "@/lib/api"

export function useLocalAuthCheck() {
  const [exists, setExists] = useState(false)
  const [checking, setChecking] = useState(true)
  const [allowRegistration, setAllowRegistration] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const response = await api.auth.local.exists.get({ headers: getAuthHeaders() })
        if (response.status === 200 && response.data) {
          setExists(response.data.exists)
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
        const response = await api.auth.local["allow-guest"].get({ headers: getAuthHeaders() })
        if (response.status === 200 && response.data) {
          setAllowRegistration(response.data)
        }
      } catch (err) {
        console.error("Failed to check if guest registration is enabled:", err)
        setAllowRegistration(false)
      }
    }

    check()
    isGuestUserRegistrationEnabled()
  }, [])

  return { allowRegistration, checking, exists }
}
