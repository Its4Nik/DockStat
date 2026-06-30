export function FeaturePill({
  icon: Icon,
  label,
  delay,
}: {
  delay: number
  icon: React.ElementType
  label: string
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-indigo-500/20"
      style={{
        animation: `rise-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20">
        <Icon
          className="text-indigo-300"
          size={18}
        />
      </div>
      <span className="text-sm font-medium text-white/70">{label}</span>
    </div>
  )
}
