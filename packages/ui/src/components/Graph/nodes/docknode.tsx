import { cn } from "@sglara/cn";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { HardDrive } from "lucide-react";
import { memo } from "react";

interface DockNodeData extends Record<string, unknown> {
  label: string;
  status: string;
  hostname?: string;
  port?: number;
}

const statusStyleMap: Record<string, string> = {
  OK: "text-badge-success-outlined-text border-badge-success-outlined-border bg-badge-success-bg/10",
  NO: "text-badge-error-outlined-text border-badge-error-outlined-border bg-badge-error-bg/10",
  "DockNode not initialised":
    "text-badge-warning-outlined-text border-badge-warning-outlined-border bg-badge-warning-bg/10",
};

const fallbackBadge =
  "text-badge-secondary-outlined-text border-badge-secondary-outlined-border bg-badge-secondary-bg/10";

export const DockNode = memo(
  ({ data, selected }: NodeProps<Node<DockNodeData>>) => {
    const badge = statusStyleMap[data.status] ?? fallbackBadge;

    return (
      <div
        className={cn(
          "min-w-45 rounded-lg border bg-graph-docknode-card-bg p-3 shadow-md transition-all duration-200",
          selected
            ? "border-2 border-graph-docknode-card-border ring-2 ring-graph-docknode-card-border/30"
            : "border border-graph-docknode-card-border/50",
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-graph-docknode-card-border/20">
            <HardDrive className="h-4 w-4 text-graph-docknode-text-secondary" />
          </div>
          <span
            className="text-sm font-semibold text-graph-docknode-text-primary truncate"
            title={data.label}
          >
            {data.label}
          </span>
        </div>

        <div className="space-y-1 text-xs">
          {data.hostname && (
            <div className="flex justify-between gap-3">
              <span className="text-graph-docknode-text-secondary">Host:</span>
              <span className="text-graph-docknode-text-primary font-mono">
                {data.hostname}:{data.port ?? 4040}
              </span>
            </div>
          )}
          <div className="pt-1">
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded-md border text-xs font-medium",
                badge,
              )}
            >
              {data.status}
            </span>
          </div>
        </div>

        <Handle
          type="target"
          position={Position.Left}
          className="w-3! h-3! bg-graph-docknode-card-border! border-2! border-graph-docknode-text-primary/40!"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3! h-3! bg-graph-docknode-card-border! border-2! border-graph-docknode-text-primary/40!"
        />
      </div>
    );
  },
);

DockNode.displayName = "DockNode";
