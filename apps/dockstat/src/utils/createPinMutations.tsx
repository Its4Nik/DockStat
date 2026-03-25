import type { UpdateResult } from "@dockstat/sqlite-wrapper"
import type { PinLinkMutation } from "@dockstat/ui"
import type { MutationResult } from "@/hooks/eden/types"
import { toast } from "@/lib/toast"

type PinInput = { path: string; slug: string }

const notify = (action: "Pinned" | "Unpinned", input: PinInput) => {
  const msg =
    action === "Pinned"
      ? `Added a new pinned link: "${input.slug}"`
      : `Unpinned link: "${input.slug}"`

  toast({
    title: `${action} "${input.slug}"!`,
    description: (
      <span>
        {msg} - <pre>{input.path}</pre>
      </span>
    ),
    variant: "success",
  })
}

export function createPinMutationHandlers({
  pinMutation,
  unPinMutation,
  isBusy,
}: {
  pinMutation: MutationResult<
    {
      changes: number
    } & UpdateResult & {
        message: string
      },
    {
      path: string
      slug: string
    }
  >
  unPinMutation: PinLinkMutation
  isBusy: boolean
}): {
  pin: PinLinkMutation
  unpin: PinLinkMutation
  isBusy: boolean
} {
  const pin = (input: PinInput) => {
    notify("Pinned", input)
    return pinMutation.mutateAsync(input)
  }

  const unpin = (input: PinInput) => {
    notify("Unpinned", input)
    return unPinMutation.mutateAsync(input)
  }

  return {
    pin,
    unpin,
    isBusy,
  }
}
