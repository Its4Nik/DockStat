import { useLocation } from "react-router"

export function getCurrentLocation() {
  const location = useLocation()

  return location
}
