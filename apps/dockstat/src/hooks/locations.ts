import { useLocation } from "react-router"

export function useCurrentLocation() {
  const location = useLocation()

  return location
}
