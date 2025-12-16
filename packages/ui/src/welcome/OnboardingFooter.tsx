import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "../components/Button/Button"
import { CardFooter } from "../components/Card/CardFooter"
import { Divider } from "../components/Divider/Divider"
import { ProgressDots } from "./ProgressDots"
import type { Slide } from "./types"

export const OnboardingFooter = ({
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onFinish,
  slides,
  goToSlide,
}: {
  currentIndex: number
  totalSlides: number
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
  slides: Slide[]
  goToSlide: (index: number) => void
}) => (
  <>
    <Divider />
    <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
        <Button onClick={onPrev} disabled={currentIndex === 0} aria-label="Previous" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Prev
        </Button>

        <ProgressDots slides={slides} currentIndex={currentIndex} onDotClick={goToSlide} />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
        {currentIndex < totalSlides - 1 ? (
          <Button onClick={onNext} aria-label="Next" size="sm">
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={onFinish}
            className="flex items-center gap-2"
            aria-label="Finish onboarding"
            size="sm"
          >
            Get started <Check className="w-4 h-4" />
          </Button>
        )}
      </div>
    </CardFooter>
  </>
)
