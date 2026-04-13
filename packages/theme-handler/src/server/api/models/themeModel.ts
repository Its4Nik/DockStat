import { t } from "elysia"

export const ThemeModel = t.Object({
  animations: t.Record(t.String(), t.Record(t.String(), t.Union([t.String(), t.Number()]))),
  id: t.Number(),
  name: t.String(),
  variables: t.Record(t.String(), t.String()),
})
