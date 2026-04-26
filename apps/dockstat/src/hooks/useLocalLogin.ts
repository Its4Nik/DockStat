import { useCallback, useState } from "react"
import { api, getAuthHeaders } from "@/lib/api"

export function useLocalLogin({
  setError,
  error,
}: {
  setError: (err: string | null) => void
  error: string | null
}) {
  const [formData, setFormData] = useState({ name: "", pass: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault()
      setError(null)
      setIsSubmitting(true)

      try {
        const response = await api.auth.local.login.post(
          {
            name: formData.name,
            pass: formData.pass,
          },
          { headers: getAuthHeaders() }
        )

        if (response.status === 401) {
          setError("Invalid username or password")
          return
        }

        if (response.status !== 200 && response.status !== 302) {
          setError("Login failed. Please try again.")
          return
        }

        const token = response.data?.token
        if (token) {
          const base64Url = token.split(".")[1]
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
              .join("")
          )

          const { user } = JSON.parse(jsonPayload)
          localStorage.setItem("user", JSON.stringify(user))
          localStorage.setItem("auth_token", token)
          localStorage.setItem("auth_provider_id", "local")

          const redirect = localStorage.getItem("auth_redirect") || "/"
          localStorage.removeItem("auth_redirect")
          window.location.href = redirect
        }
      } catch (err) {
        console.error("Local login error:", err)
        setError("Login failed. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData]
  )

  const updateField = useCallback((field: "name" | "pass", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  return {
    error,
    formData,
    handleSubmit,
    isSubmitting,
    showPassword,
    togglePassword,
    updateField,
  }
}
