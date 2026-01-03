import { useState } from "react"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"

export function PageHeadingProvider({ children }: { children: React.ReactNode }) {
  const [pageHeading, setPageHeading] = useState<string>("")
  return (
    <PageHeadingContext value={{ heading: pageHeading, setHeading: setPageHeading }}>
      {children}
    </PageHeadingContext>
  )
}
