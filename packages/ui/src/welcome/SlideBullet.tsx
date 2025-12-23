import { Check } from "lucide-react"

export const SlideBullet = ({
  bullet,
  index,
  isActive,
}: {
  bullet: { title: string; desc?: string }
  index: number
  isActive: boolean
}) => (
  <div
    className="group relative p-6 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-950/80 hover:border-slate-600 transition-all duration-500 backdrop-blur-sm"
    style={{
      opacity: isActive ? 1 : 0,
      transform: isActive ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
      transitionDelay: `${index * 150}ms`,
    }}
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Check className="w-5 h-5 text-green-400" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-white mb-1.5 tracking-tight">{bullet.title}</h3>
        {bullet.desc && (
          <p className="text-sm text-slate-400 leading-relaxed break-words">{bullet.desc}</p>
        )}
      </div>
    </div>

    {/* Subtle gradient overlay on hover */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  </div>
)
