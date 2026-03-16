import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { Card } from "../../Card/Card";

interface ContainerNodeData extends Record<string, unknown> {
  label: string;
  status: string;
  image?: string;
  hostId?: number;
}

export const containerNode = memo(
  ({ data, selected }: NodeProps<Node<ContainerNodeData>>) => {
    return (
      <Card
        variant="custom"
        size="sm"
        className={`from-graph-container-card-bg-from to-graph-container-card-bg-to bg-linear-to-bl border-graph-container-card-border ${selected ? "border-4" : "border"}`}
      >
        <div className="flex flex-col">
          <div>{data.label}</div>
          <div>{data.status}</div>
          <div>{data.image}</div>
          <div>{data.hostId}</div>
        </div>
        <Handle
          isConnectable={false}
          type="target"
          position={Position.Left}
          className="w-2.5! h-2.5! bg-orange-400! border-2! border-orange-200!"
        />
      </Card>
    );
  },
);
