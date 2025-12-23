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
      className={`absolute inset-0 transition-all duration-500 ease-in-out ${slideClass}`}
      style={{ transitionProperty: "transform, opacity" }}
    >
      <div className="h-full w-full flex flex-col px-8 py-8 overflow-y-auto">
        <SlideHeader slide={slide} currentStep={index} totalSteps={slides.length} />
        <div className="flex-1 mt-8">
          <SlideContent slide={slide} isActive={index === currentIndex} />
        </div>
      </div>
    </article>
  )
}
