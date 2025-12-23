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
    <CardFooter className="flex items-center justify-between gap-4 px-8 py-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={onPrev}
          disabled={currentIndex === 0}
          aria-label="Previous slide"
          variant="outline"
          size="md"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <ProgressDots slides={slides} currentIndex={currentIndex} onDotClick={goToSlide} />
      </div>

      <div className="flex items-center gap-4">
        {currentIndex < totalSlides - 1 ? (
          <Button onClick={onNext} aria-label="Next slide" variant="primary" size="md">
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={onFinish}
            className="flex items-center gap-2"
            aria-label="Finish onboarding"
            variant="primary"
            size="md"
          >
            Get Started
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </CardFooter>
  </>
)
