import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import type React from "react"
import { useCallback, useMemo } from "react"

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
  isLoading?: boolean
  isError?: boolean
  children?: React.ReactNode
}

// Floating icon component with orbital motion and parallax
function FloatingIconElement({
  icon,
  initialX,
  initialY,
  size,
  delay,
  orbitRadius,
  orbitSpeed,
  layer,
  mouseX,
  mouseY,
  isLoading,
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
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  isLoading: boolean
  isError: boolean
}) {
  const parallaxStrength = layer === 1 ? 0.02 : layer === 2 ? 0.05 : 0.1
  const opacity = layer === 1 ? 0.3 : layer === 2 ? 0.5 : 0.8

  const springConfig = { damping: 25, stiffness: 150 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  const translateX = useTransform(
    smoothMouseX,
    [0, 1],
    [-50 * parallaxStrength * 100, 50 * parallaxStrength * 100]
  )
  const translateY = useTransform(
    smoothMouseY,
    [0, 1],
    [-50 * parallaxStrength * 100, 50 * parallaxStrength * 100]
  )

  // Error shake animation
  const errorShake = isError
    ? {
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 0.5,
        },
        x: [0, -10, 10, -10, 10, -5, 5, 0],
      }
    : {}

  return (
    <motion.div
      animate={{
        opacity: isError ? opacity * 0.6 : opacity,
        scale: 1,
        ...errorShake,
      }}
      className="absolute pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
        x: translateX,
        y: translateY,
      }}
      transition={{
        opacity: { delay: delay * 0.1, duration: 0.8 },
        scale: {
          damping: 15,
          delay: delay * 0.1,
          stiffness: 200,
          type: "spring",
        },
      }}
    >
      {/* Orbital motion wrapper */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        className="relative"
        style={{ height: orbitRadius * 2, width: orbitRadius * 2 }}
        transition={{
          duration: isLoading ? orbitSpeed * 0.3 : orbitSpeed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {/* The actual icon */}
        <motion.div
          animate={{
            rotate: -360, // Counter-rotate to keep icon upright
          }}
          className="absolute"
          style={{
            left: "50%",
            marginLeft: -size / 2,
            top: 0,
          }}
          transition={{
            duration: isLoading ? orbitSpeed * 0.3 : orbitSpeed,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <motion.div
            animate={{
              scale: isLoading ? [1, 1.2, 1] : isError ? [1, 0.9, 1] : 1,
            }}
            className="relative"
            transition={{
              duration: isLoading ? 0.6 : 0.3,
              ease: "easeInOut",
              repeat: isLoading || isError ? Infinity : 0,
            }}
          >
            {/* Glow effect */}
            <motion.div
              animate={{
                backgroundColor: isError
                  ? "rgba(239, 68, 68, 0.4)"
                  : isLoading
                    ? "rgba(59, 130, 246, 0.4)"
                    : "rgba(255, 255, 255, 0.1)",
                scale: isLoading ? [1, 1.5, 1] : isError ? [1, 1.8, 1] : 1,
              }}
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                height: size,
                width: size,
              }}
              transition={{
                duration: isLoading ? 1 : 0.5,
                repeat: isLoading || isError ? Infinity : 0,
              }}
            />

            {/* Icon container */}
            <motion.div
              animate={{
                backgroundColor: isError
                  ? "rgba(239, 68, 68, 0.15)"
                  : isLoading
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(255, 255, 255, 0.05)",
                borderColor: isError
                  ? "rgba(239, 68, 68, 0.3)"
                  : isLoading
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(255, 255, 255, 0.1)",
              }}
              className="relative flex items-center justify-center rounded-xl backdrop-blur-sm"
              style={{
                fontSize: size * 0.5,
                height: size,
                width: size,
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{
                  color: isError ? "rgb(239, 68, 68)" : isLoading ? "rgb(59, 130, 246)" : undefined,
                }}
                className="text-foreground/70"
              >
                {icon}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// Particle system for extra flair
function ParticleField({ isLoading, isError }: { isLoading: boolean; isError: boolean }) {
  const particles = useMemo(
    () =>
      [...Array(80)].map((_, i) => ({
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
        <motion.div
          animate={{
            backgroundColor: isError
              ? "rgb(239, 68, 68)"
              : isLoading
                ? "rgb(59, 130, 246)"
                : "rgb(255, 255, 255)",
            opacity: isError ? [0.1, 0.5, 0.1] : [0.1, 0.4, 0.1],
            y: [0, -30, 0],
          }}
          className="absolute rounded-full"
          key={particle.id}
          style={{
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
          }}
          transition={{
            backgroundColor: {
              duration: 0.3,
            },
            opacity: {
              delay: particle.delay,
              duration: isLoading ? particle.duration * 0.3 : particle.duration,
              ease: "easeInOut",
              repeat: Infinity,
            },
            y: {
              delay: particle.delay,
              duration: isLoading ? particle.duration * 0.3 : particle.duration,
              ease: "easeInOut",
              repeat: Infinity,
            },
          }}
        />
      ))}
    </div>
  )
}

// Grid lines effect
function GridEffect({ isLoading, isError }: { isLoading: boolean; isError: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          animate={{
            backgroundColor: isError
              ? "rgb(239, 68, 68)"
              : isLoading
                ? "rgb(59, 130, 246)"
                : "rgb(255, 255, 255)",
            opacity: 0.05,
            scaleX: 1,
          }}
          className="absolute left-0 right-0 h-px"
          initial={{ opacity: 0, scaleX: 0 }}
          key={`h-${i}`}
          style={{ top: `${(i + 1) * 5}%` }}
          transition={{
            backgroundColor: { duration: 0.3 },
            opacity: { delay: i * 0.05, duration: 1 },
            scaleX: { delay: i * 0.05, duration: 1 },
          }}
        />
      ))}
      {/* Vertical lines */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          animate={{
            backgroundColor: isError
              ? "rgb(239, 68, 68)"
              : isLoading
                ? "rgb(59, 130, 246)"
                : "rgb(255, 255, 255)",
            opacity: 0.05,
            scaleY: 1,
          }}
          className="absolute top-0 bottom-0 w-px"
          initial={{ opacity: 0, scaleY: 0 }}
          key={`v-${i}`}
          style={{ left: `${(i + 1) * 5}%` }}
          transition={{
            backgroundColor: { duration: 0.3 },
            opacity: { delay: i * 0.05, duration: 1 },
            scaleY: { delay: i * 0.05, duration: 1 },
          }}
        />
      ))}
    </div>
  )
}

export function AnimatedIconBackground({
  icons,
  isLoading = false,
  isError = false,
  children,
}: AnimatedIconBackgroundProps) {
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width)
      mouseY.set((e.clientY - rect.top) / rect.height)
    },
    [mouseX, mouseY]
  )

  // Generate floating icons with varied positions and properties
  const floatingIcons: FloatingIcon[] = useMemo(() => {
    const positions = [
      // Layer 1 - Far background (smaller, slower, less opacity)
      { layer: 1, x: 10, y: 15 },
      { layer: 1, x: 85, y: 20 },
      { layer: 1, x: 15, y: 75 },
      { layer: 1, x: 90, y: 80 },
      { layer: 1, x: 50, y: 10 },
      { layer: 1, x: 50, y: 90 },
      // Layer 2 - Mid ground
      { layer: 2, x: 20, y: 35 },
      { layer: 2, x: 80, y: 40 },
      { layer: 2, x: 25, y: 60 },
      { layer: 2, x: 75, y: 65 },
      { layer: 2, x: 8, y: 50 },
      { layer: 2, x: 92, y: 50 },
      // Layer 3 - Close to viewer (larger, faster parallax)
      { layer: 3, x: 30, y: 20 },
      { layer: 3, x: 70, y: 25 },
      { layer: 3, x: 35, y: 75 },
      { layer: 3, x: 65, y: 80 },
      // Layer 4 - Foreground elements (even larger, faster parallax)
      { layer: 4, x: 12, y: 85 },
      { layer: 4, x: 45, y: 30 },
      { layer: 4, x: 88, y: 55 },
      { layer: 4, x: 60, y: 92 },
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
    <motion.div
      animate={{
        backgroundColor: isError ? "rgb(10, 5, 5)" : isLoading ? "rgb(5, 5, 15)" : "rgb(5, 5, 10)",
      }}
      className="relative w-full h-full min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      transition={{ duration: 0.5 }}
    >
      {/* Radial gradient overlay */}
      <motion.div
        animate={{
          background: isError
            ? "radial-gradient(ellipse at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)"
            : isLoading
              ? "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%)",
        }}
        className="absolute inset-0 pointer-events-none"
        transition={{ duration: 0.5 }}
      />

      {/* Grid effect */}
      <GridEffect
        isError={isError}
        isLoading={isLoading}
      />

      {/* Particle field */}
      <ParticleField
        isError={isError}
        isLoading={isLoading}
      />

      {/* Floating icons */}
      {floatingIcons.map((floatingIcon) => (
        <FloatingIconElement
          delay={floatingIcon.delay}
          duration={floatingIcon.duration}
          icon={floatingIcon.icon}
          initialX={floatingIcon.x}
          initialY={floatingIcon.y}
          isError={isError}
          isLoading={isLoading}
          key={floatingIcon.id}
          layer={floatingIcon.layer}
          mouseX={mouseX}
          mouseY={mouseY}
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
    </motion.div>
  )
}
