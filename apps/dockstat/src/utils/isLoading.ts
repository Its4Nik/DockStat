import { useIsFetching, useIsMutating } from "@tanstack/react-query"

export function GlobalBusy() {
  const busy = useIsFetching() + useIsMutating() > 0

  return busy
}
