import { motion } from "framer-motion"
import type React from "react"
import { useCallback, useMemo, useRef } from "react"

interface FloatingIcon {
  id: number
  icon: React.ReactNode
  x: number
  y: number
  size: number
  delay: number
  duration: number
  orbitRadius: number
  orbitSpeed: number
  layer: number // 1 = far, 2 = mid, 3 = close
}

interface AnimatedIconBackgroundProps {
  icons: React.ReactNode[]
  isError?: boolean
  children?: React.ReactNode
}

// Floating icon component using CSS transforms and animations for performance
function FloatingIconElement({
  icon,
  initialX,
  initialY,
  size,
  delay,
  orbitRadius,
  orbitSpeed,
  layer,
  isError,
}: {
  icon: React.ReactNode
  initialX: number
  initialY: number
  size: number
  delay: number
  duration: number
  orbitRadius: number
  orbitSpeed: number
  layer: number
  isError: boolean
}) {
  // Parallax translation ranges based on layer depth
  const parallaxX = layer === 1 ? 20 : layer === 2 ? 50 : 100
  const parallaxY = layer === 1 ? 20 : layer === 2 ? 50 : 100

  return (
    <motion.div
      animate={{
        opacity: isError ? 0.6 : 1,
        scale: 1,
        x: isError ? [0, -10, 10, -10, 10, -5, 5, 0] : 0, // Error shake
      }}
      className="absolute pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
        // CSS-driven parallax based on mouse variables set on parent
        transform: `translate(
          calc((var(--mouse-x, 0.5) - 0.5) * ${parallaxX}px),
          calc((var(--mouse-y, 0.5) - 0.5) * ${parallaxY}px)
        )`,
        transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)", // Smooth CSS transition
        willChange: "transform",
      }}
      transition={{
        opacity: { delay: delay * 0.1, duration: 0.8 },
        scale: { damping: 15, delay: delay * 0.1, stiffness: 200, type: "spring" },
        x: { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 },
      }}
    >
      {/* Orbital motion wrapper - CSS Animation */}
      <div
        className="relative"
        style={{
          animation: `orbit ${orbitSpeed}s linear infinite`,
          height: orbitRadius * 2,
          width: orbitRadius * 2,
        }}
      >
        {/* Counter-rotate to keep icon upright - CSS Animation */}
        <div
          className="absolute"
          style={{
            animation: `counter-orbit ${orbitSpeed}s linear infinite`,
            left: "50%",
            marginLeft: -size / 2,
            top: 0,
          }}
        >
          {/* Visual Icon Container */}
          <div
            className="relative"
            style={{ height: size, width: size }}
          >
            {/* Glow effect - Tailwind classes */}
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-colors duration-300 ${
                isError ? "bg-red-500/40" : "bg-accent/40"
              }`}
            />

            {/* Icon container - Tailwind classes */}
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-xl border backdrop-blur-sm transition-colors duration-300 ${
                isError ? "border-red-500/30 bg-red-500/15" : "border-accent/10 bg-accent/5"
              }`}
              style={{ fontSize: size * 0.5 }}
            >
              <div
                className={`transition-colors duration-300 ${
                  isError ? "text-red-500" : "text-accent/70"
                }`}
              >
                {icon}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Particle system optimized with pure CSS animations
function ParticleField({ isError }: { isError: boolean }) {
  const particles = useMemo(
    () =>
      [...Array(40)].map((_, i) => ({
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10,
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          className={`absolute rounded-full transition-colors duration-300 ${
            isError ? "bg-red-500" : "bg-accent"
          }`}
          key={particle.id}
          style={{
            animation: `float-particle ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
          }}
        />
      ))}
    </div>
  )
}

// Grid effect optimized into a single CSS background image (Massive perf boost)
function GridEffect({ isError }: { isError: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none transition-all duration-300"
      style={{
        backgroundImage: isError
          ? `linear-gradient(rgba(239, 68, 68, 0.05) 1px, transparent 1px),
             linear-gradient(90deg, rgba(239, 68, 68, 0.05) 1px, transparent 1px)`
          : `linear-gradient(rgb(var(--color-accent, 255 255 255) / 0.05) 1px, transparent 1px),
             linear-gradient(90deg, rgb(var(--color-accent, 255 255 255) / 0.05) 1px, transparent 1px)`,
        backgroundSize: "5% 5%",
      }}
    />
  )
}

export function AnimatedIconBackground({
  icons,
  isError = false,
  children,
}: AnimatedIconBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Update CSS variables for parallax on mouse move (Runs entirely on GPU/CSS)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width).toFixed(3)
    const y = ((e.clientY - rect.top) / rect.height).toFixed(3)
    containerRef.current.style.setProperty("--mouse-x", x)
    containerRef.current.style.setProperty("--mouse-y", y)
  }, [])

  const floatingIcons: FloatingIcon[] = useMemo(() => {
    const positions = [
      { layer: 1, x: 10, y: 15 },
      { layer: 1, x: 85, y: 20 },
      { layer: 1, x: 15, y: 75 },
      { layer: 1, x: 90, y: 80 },
      { layer: 1, x: 50, y: 10 },
      { layer: 1, x: 50, y: 90 },
      { layer: 2, x: 20, y: 35 },
      { layer: 2, x: 80, y: 40 },
      { layer: 2, x: 25, y: 60 },
      { layer: 2, x: 75, y: 65 },
      { layer: 2, x: 8, y: 50 },
      { layer: 2, x: 92, y: 50 },
      { layer: 3, x: 30, y: 20 },
      { layer: 3, x: 70, y: 25 },
      { layer: 3, x: 35, y: 75 },
      { layer: 3, x: 65, y: 80 },
    ]

    return positions.map((pos, i) => ({
      delay: i,
      duration: 3 + Math.random() * 2,
      icon: icons[i % icons.length],
      id: i,
      layer: pos.layer,
      orbitRadius: pos.layer === 1 ? 15 : pos.layer === 2 ? 20 : 25,
      orbitSpeed: pos.layer === 1 ? 30 : pos.layer === 2 ? 20 : 15,
      size: pos.layer === 1 ? 40 : pos.layer === 2 ? 50 : 60,
      x: pos.x,
      y: pos.y,
    }))
  }, [icons])

  return (
    <div
      className="relative w-full h-full min-h-screen overflow-hidden transition-colors duration-500"
      onMouseMove={handleMouseMove}
      ref={containerRef}
      style={{ backgroundColor: isError ? "rgb(10, 5, 5)" : "rgb(5, 5, 10)" }}
    >
      {/* Performance CSS Keyframes */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counter-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes float-particle {
          0%, 100% { opacity: 0.1; transform: translateY(0); }
          50% { opacity: 0.4; transform: translateY(-30px); }
        }
      `}</style>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          background: isError
            ? "radial-gradient(ellipse at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, rgb(var(--color-accent, 255 255 255) / 0.1) 0%, transparent 70%)",
        }}
      />

      <GridEffect isError={isError} />
      <ParticleField isError={isError} />

      {/* Floating icons */}
      {floatingIcons.map((floatingIcon) => (
        <FloatingIconElement
          delay={floatingIcon.delay}
          duration={floatingIcon.duration}
          icon={floatingIcon.icon}
          initialX={floatingIcon.x}
          initialY={floatingIcon.y}
          isError={isError}
          key={floatingIcon.id}
          layer={floatingIcon.layer}
          orbitRadius={floatingIcon.orbitRadius}
          orbitSpeed={floatingIcon.orbitSpeed}
          size={floatingIcon.size}
        />
      ))}

      {/* Content overlay */}
      <div className="relative z-20">{children}</div>

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  )
}
