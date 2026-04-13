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
          aria-label="Previous slide"
          disabled={currentIndex === 0}
          onClick={onPrev}
          size="md"
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <ProgressDots
          currentIndex={currentIndex}
          onDotClick={goToSlide}
          slides={slides}
        />
      </div>

      <div className="flex items-center gap-4">
        {currentIndex < totalSlides - 1 ? (
          <Button
            aria-label="Next slide"
            onClick={onNext}
            size="md"
            variant="primary"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            aria-label="Finish onboarding"
            className="flex items-center gap-2"
            onClick={onFinish}
            size="md"
            variant="primary"
          >
            Get Started
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </CardFooter>
  </>
)
