import { t } from "elysia"

export namespace MetricsModel {
  export const prometheusRes = t.String()
  export type prometheusRes = string

  export const prometheusError = t.Object({
    success: t.Literal(false),
    error: t.String(),
    message: t.String(),
  })
}

