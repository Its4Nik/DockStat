import { t } from "elysia"
import { ThemeModel } from "./themeModel"

export namespace themeResponse {
  export const error = t.Object({
    error: t.String(),
    success: t.Literal(false),
  })

  export const success = {
    default: t.Object({
      data: ThemeModel,
      message: t.String(),
      success: t.Literal(true),
    }),
    delete: t.Object({
      message: t.String(),
      success: t.Literal(true),
    }),
    list: t.Object({
      data: t.Array(ThemeModel),
      message: t.String(),
      success: t.Literal(true),
    }),
  }
}
