import { ThemeModel } from "./themeModel"
import { themeMutation } from "./themePost"
import { themeResponse } from "./themeResponses"

export const theme = { model: { db: ThemeModel, post: themeMutation }, responses: themeResponse }
