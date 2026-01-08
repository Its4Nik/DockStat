import type { UseSlideReturn } from "./useSlideState"
import { AnimatePresence, motion } from "framer-motion"
import { collapseVariants, slideVariants } from "./animations"

export const SlideContent = ({
  state,
  children,
}: {
  state: UseSlideReturn
  children: Record<string, React.ReactNode>
}) => {
  const hasContent =
    state.activeSlide &&
    children[state.activeSlide] !== null &&
    children[state.activeSlide] !== undefined
  const show = hasContent || !state.isCollapsed

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={collapseVariants(state.contentHeight)}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="relative">
            <AnimatePresence initial={false} custom={state.animationDirection}>
              {state.activeSlide && !state.isCollapsed && (
                <motion.div
                  key={state.activeSlide}
                  custom={state.animationDirection}
                  variants={slideVariants(state.contentHeight)}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                  }}
                >
                  <div
                    ref={(el) => {
                      state.contentRefs.current[state.activeSlide!] = el
                    }}
                  >
                    {children[state.activeSlide]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
