import { Card } from "@dockstat/ui"
import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer, // Import this
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react"

type CustomEdgeData = { value: number }
type CustomEdge = Edge<CustomEdgeData, "custom">

export default function DockStatLabelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  sourcePosition,
  targetPosition,
  style,
}: EdgeProps<CustomEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    // Destructure labelX and labelY
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} style={style} path={edgePath} />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="nodrag nopan"
          >
            <Card glass size="xs" className="text-xs" variant="outlined">
              {label}
            </Card>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
