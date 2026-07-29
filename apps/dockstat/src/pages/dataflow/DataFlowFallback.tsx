import { useEffect } from "react"
import { useNavigate } from "react-router"

export default function DataFlowFallback() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/dashboard", { replace: true })
  }, [navigate])

  return null
}
