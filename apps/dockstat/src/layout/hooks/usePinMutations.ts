import { useConfigMutations } from "@/hooks/mutations"

export function usePinMutations() {
  const { pinLinkMutation, unpinLinkMutation } = useConfigMutations()

  return { pinMutation: pinLinkMutation, unPinMutation: unpinLinkMutation }
}
