import { useIsFetching, useIsMutating } from "@tanstack/react-query"

export function useGlobalBusy() {
  const busy = useIsFetching() + useIsMutating() > 0

  return busy
}
