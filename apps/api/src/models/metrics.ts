import { t } from "elysia"

export namespace MetricsModel {
  export const prometheusRes = t.String()
  export type prometheusRes = string

  export const prometheusError = t.Object({
    error: t.Unknown(),
    message: t.Literal("Could not get Prometheus metrics!"),
  })
}
