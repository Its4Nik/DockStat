import { AnimatePresence, motion } from "framer-motion"
import { slideVariants } from "./animations"
import type { UseSlideReturn } from "./useSlideState"

export const SlideContent = ({
  state,
  children,
}: {
  state: UseSlideReturn
  children: Record<string, React.ReactNode>
}) => {
  const activeKey = state.activeSlide
  const hasContent =
    activeKey != null && Object.hasOwn(children, activeKey) && children[activeKey] != null

  const show = hasContent || !state.isCollapsed

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          // Animate height and opacity directly from the measured contentHeight.
          // Using numeric heights ensures updates to `state.contentHeight` trigger animations
          // when dynamic content resizes (ResizeObserver updates the value).
          animate={{ height: show ? state.contentHeight : 0, opacity: show ? 1 : 0 }}
          className="overflow-hidden"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="relative">
            <AnimatePresence
              custom={state.animationDirection}
              initial={false}
              mode="popLayout"
            >
              {state.activeSlide && !state.isCollapsed && (
                <motion.div
                  animate="center"
                  custom={state.animationDirection}
                  exit="exit"
                  initial="enter"
                  key={state.activeSlide}
                  transition={{
                    x: { duration: 0.3, type: "tween" },
                  }}
                  variants={slideVariants}
                >
                  <div
                    ref={(el) => {
                      if (state.activeSlide !== null) {
                        state.contentRefs.current[state.activeSlide] = el
                      }
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
