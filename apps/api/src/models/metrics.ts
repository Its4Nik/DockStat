import { t } from "elysia"

export namespace MetricsModel {
  export const prometheusRes = t.String()
  export type prometheusRes = string

  export const prometheusError = t.Object({
    error: t.String(),
    message: t.String(),
    success: t.Literal(false),
  })
}
