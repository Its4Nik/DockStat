import { ReactFlowProvider } from "@xyflow/react";
import { usePageHeading } from "@/hooks/useHeading";
import { GraphFlow } from "@/components/graph/flow";

import "@xyflow/react/dist/style.css";

export default function GraphPage() {
  usePageHeading("Infrastructure Graph");

  return (
    <ReactFlowProvider>
      <GraphFlow />
    </ReactFlowProvider>
  );
}
