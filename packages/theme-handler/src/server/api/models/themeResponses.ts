import { t } from "elysia"
import { theme } from "."

export namespace themeResponse {
  export const error = t.Object({
    success: t.Literal(false),
    error: t.String(),
  })

  export const success = {
    list: t.Object({
      success: t.Literal(true),
      message: t.String(),
      data: t.Array(theme.model),
    }),
    default: t.Object({
      success: t.Literal(true),
      message: t.String(),
      data: theme.model,
    }),
    delete: t.Object({
      success: t.Literal(true),
      message: t.String(),
    }),
  }
}
