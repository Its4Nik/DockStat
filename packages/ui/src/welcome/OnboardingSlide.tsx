import { slides } from "./CONSTS"
import { SlideContent } from "./SlideContent"
import { SlideHeader } from "./SlideHeader"
import type { Slide } from "./types"

export const OnboardingSlide = ({
  slide,
  index,
  currentIndex,
}: {
  slide: Slide
  index: number
  currentIndex: number
}) => {
  const slideClass =
    index === currentIndex
      ? "translate-x-0 opacity-100 z-20"
      : index < currentIndex
        ? "-translate-x-full opacity-0 z-10"
        : "translate-x-full opacity-0 z-10"

  return (
    <article
      aria-hidden={index !== currentIndex}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${slides.length} — ${slide.title}`}
      className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${slideClass}`}
      style={{ transitionProperty: "transform, opacity", transitionDuration: "420ms" }}
    >
      <div className="flex flex-col gap-6 p-2 sm:p-4 overflow-visible">
        <SlideHeader slide={slide} currentStep={index} totalSteps={slides.length} />
        <SlideContent slide={slide} isActive={index === currentIndex} />
      </div>
    </article>
  )
}
