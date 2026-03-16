export function Legend() {
  return (
    <div className="p-3 border-t border-border">
      <h3 className="text-xs font-semibold mb-2 text-muted-text">Legend</h3>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Client (Monitor)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Host (Docker)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>DockNode (Remote)</span>
        </div>
      </div>
    </div>
  );
}
