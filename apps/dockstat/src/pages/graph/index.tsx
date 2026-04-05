import { ReactFlowProvider } from "@xyflow/react"
import { GraphFlow } from "@/components/graph/flow"
import { usePageHeading } from "@/hooks/useHeading"

import "@xyflow/react/dist/style.css"

export default function GraphPage() {
  usePageHeading("Infrastructure Graph")

  return (
    <ReactFlowProvider>
      <GraphFlow />
    </ReactFlowProvider>
  )
}
