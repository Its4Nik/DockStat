export function OptionsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-secondary-text uppercase tracking-wide">{title}</h4>
      <div className="bg-card-flat-bg rounded-md px-3 py-1">{children}</div>
    </div>
  )
}
