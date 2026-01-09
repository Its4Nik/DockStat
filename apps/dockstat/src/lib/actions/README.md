---
id: 57802308-6a42-4d47-82b6-bc553ae10e9c
title: "Frontend: Actions"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: a81b5d89-a300-47ac-8ffa-a3b851645978
updatedAt: 2026-01-01T20:40:03.579Z
urlId: 0tWEK43tNb
---

## `lib/actions/` (Forms / Mutations)

This folder contains all **client-side "write" operations** used by forms and UI interactions: creating, updating, deleting, and triggering server-side effects. These functions are typically consumed by **TanStack React Query mutations** (`useMutation`) or called by form submit handlers.

### Pattern

* **One exported async function per action/use-case**
* Accept a single `input` object (easy to validate + extend)
* Call the API client (`api...`)
* If the API returns an error, **throw**
* Otherwise **return** `**data**` (or a minimal success payload)

### Example

```tsx
import { api } from "./api"

type UpdateProfileInput = {
  name: string
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data, error } = await api.api.v2.profile.patch({
    name: input.name,
  })

  if (error) {
    throw new Error(String(error.value))
  }

  return data
}
```

### Usage (in forms)

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProfile } from "@/lib/actions/updateProfile"

export function ProfileForm() {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      // keep UI in sync
      await qc.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        mutation.mutate({ name: String(form.get("name") || "") })
      }}
    >
      <input name="name" />
      <button type="submit" disabled={mutation.isPending}>
        Save
      </button>

      {mutation.error ? <div>Failed to save</div> : null}
    </form>
  )
}
```

### Naming + organization

* Use verbs: `createX`, `updateX`, `deleteX`, `inviteX`, `uploadX`, `publishX`
* Group by domain when it grows:
  * `actions/auth/`
  * `actions/profile/`
  * `actions/projects/`

### Rules

* Always `throw` on API errors (React Query will surface it in `mutation.error`)
* Keep **UI concerns out** of actions (no toasts, no routing, no cache invalidation here)
* Keep input types close to the action
* Return only what the caller needs (don't over-return)