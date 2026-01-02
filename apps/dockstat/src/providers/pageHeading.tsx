import { PageHeadingContext } from "@/contexts/pageHeadingContext"
import { useState } from "react"

export function PageHeadingProvider({ children }: { children: React.ReactNode }) {
  const [pageHeading, setPageHeading] = useState<string>("")
  return (
    <PageHeadingContext value={{ heading: pageHeading, setHeading: setPageHeading }}>
      {children}
    </PageHeadingContext>
  )
}
