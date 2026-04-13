import { t } from "elysia"

export const themeMutation = t.Object({
  animations: t.Optional(
    t.Record(t.String(), t.Record(t.String(), t.Union([t.String(), t.Number()])))
  ),
  name: t.String(),
  variables: t.Optional(t.Record(t.String(), t.String())),
})
