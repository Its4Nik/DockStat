export function Legend() {
  return (
    <div className="p-3 border-t border-divider-color">
      <h3 className="text-xs font-semibold mb-2 text-muted-text">Legend</h3>
      <div className="space-y-1.5 text-xs text-secondary-text">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-graph-client-card-border" />
          <span>Client (Monitor)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-graph-host-card-border" />
          <span>Host (Docker)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-graph-docknode-card-border" />
          <span>DockNode (Remote)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-graph-container-card-border" />
          <span>Container</span>
        </div>
      </div>
    </div>
  )
}
