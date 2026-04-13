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
    sourcePosition,
    // Destructure labelX and labelY
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <Card
              className="text-xs"
              glass
              size="xs"
              variant="outlined"
            >
              {label}
            </Card>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
