import type React from "react"
import { useMemo } from "react"

interface AnimatedIconBackgroundProps {
  icons: React.ReactNode[]
  isError?: boolean
  children?: React.ReactNode
}

// Simple floating icon with minimal animations
function SimpleFloatingIcon({
  icon,
  index,
  isError,
}: {
  icon: React.ReactNode
  index: number
  isError: boolean
}) {
  // Distribute icons across the left side (hero panel area)
  const x = 10 + (index % 3) * 25
  const y = 20 + Math.floor(index / 3) * 30
  const delay = index * 0.2
  // Deterministic size based on index to prevent size changes on re-render
  const size = 45 + (index % 5) * 8

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        animation: `gentle-float 6s ease-in-out ${delay}s infinite alternate`,
        left: `${x}%`,
        opacity: isError ? 0.4 : 0.6,
        top: `${y}%`,
      }}
    >
      <div
        className="transition-colors duration-300"
        style={{ height: size, width: size }}
      >
        <div
          className={`w-full h-full flex items-center justify-center rounded-xl border backdrop-blur-sm transition-colors duration-300 ${
            isError ? "border-red-500/20 bg-red-500/10" : "border-white/10 bg-white/5"
          }`}
        >
          <div
            className={`transition-colors duration-300 ${isError ? "text-red-400" : "text-white/40"}`}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AnimatedIconBackground({
  icons,
  isError = false,
  children,
}: AnimatedIconBackgroundProps) {
  // Use more icons (up to 12) distributed across the left side (hero panel area)
  const floatingIcons = useMemo(() => {
    return icons.slice(0, 12).map((icon, i) => ({ icon, id: i }))
  }, [icons])

  return (
    <div
      className={`relative w-full h-full min-h-screen overflow-hidden transition-colors duration-500 ${
        isError ? "bg-red-950" : "bg-slate-950"
      }`}
    >
      {/* Simple CSS animation keyframes */}
      <style>{`
        @keyframes gentle-float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(2deg); }
        }
      `}</style>

      {/* Simple gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          background: isError
            ? "radial-gradient(ellipse at center, rgba(239, 68, 68, 0.08) 0%, transparent 60%)"
            : "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Simple floating icons (only 6) */}
      {floatingIcons.map((item) => (
        <SimpleFloatingIcon
          icon={item.icon}
          index={item.id}
          isError={isError}
          key={item.id}
        />
      ))}

      {/* Content overlay */}
      <div className="relative z-20">{children}</div>

      {/* Simple vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  )
}
