import { t } from "elysia"
import { ThemeModel } from "./themeModel"

export namespace themeResponse {
  export const error = t.Object({
    success: t.Literal(false),
    error: t.String(),
  })

  export const success = {
    list: t.Object({
      success: t.Literal(true),
      message: t.String(),
      data: t.Array(ThemeModel),
    }),
    default: t.Object({
      success: t.Literal(true),
      message: t.String(),
      data: ThemeModel,
    }),
    delete: t.Object({
      success: t.Literal(true),
      message: t.String(),
    }),
  }
}
