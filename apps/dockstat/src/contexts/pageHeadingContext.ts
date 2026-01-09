import { createContext, type Dispatch, type SetStateAction } from "react"

export const PageHeadingContext = createContext<{
  heading: string
  setHeading: Dispatch<SetStateAction<string>>
}>({
  heading: "",
  setHeading: () => {},
})
