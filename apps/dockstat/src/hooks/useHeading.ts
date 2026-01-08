import { useContext, useEffect } from "react"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"

export function usePageHeading(title: string): void {
  const { setHeading } = useContext(PageHeadingContext)

  useEffect(() => {
    setHeading(title)
  }, [setHeading, title])
}
