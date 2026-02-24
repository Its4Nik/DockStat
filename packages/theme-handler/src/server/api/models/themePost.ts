import { t } from "elysia"

export const themeMutation = t.Object({
  name: t.String(),
  variables: t.Optional(t.Record(t.String(), t.String())),
  animations: t.Optional(
    t.Record(t.String(), t.Record(t.String(), t.Union([t.String(), t.Number()])))
  ),
})
