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
    className="p-3 rounded border border-slate-700 bg-slate-950/60 transition-all duration-500 wrap-break-words"
    style={{
      opacity: isActive ? 1 : 0,
      transform: isActive ? "translateY(0)" : "translateY(10px)",
      transitionDelay: `${index * 500}ms`,
    }}
  >
    <div className="flex items-start gap-3 text-left">
      <div className="flex-none">
        <Check className="w-full h-full text-success" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{bullet.title}</div>
        {bullet.desc && (
          <div className="text-sm text-slate-400 wrap-break-words">{bullet.desc}</div>
        )}
      </div>
    </div>
  </div>
)
