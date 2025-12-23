import { useCallback, useEffect, useState } from "react"
import { Card, CardBody } from "../components/Card/Card"
import { slides } from "./CONSTS"
import IntroScreen from "./Intro"
import { OnboardingFooter } from "./OnboardingFooter"
import { OnboardingHeader } from "./OnboardingHeader"
import { OnboardingSlide } from "./OnboardingSlide"
import type { OnboardingProps } from "./types"

export function Onboarding({ setOnBoardingComplete }: OnboardingProps) {
  const totalSlides = slides.length

  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, totalSlides - 1))
  }, [totalSlides])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  const goToSlide = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(Math.trunc(index), totalSlides - 1))
      setCurrentIndex(next)
    },
    [totalSlides]
  )

  const finish = useCallback(() => setOnBoardingComplete(true), [setOnBoardingComplete])

  const skip = useCallback(() => setOnBoardingComplete(true), [setOnBoardingComplete])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return

      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev])

  return (
    <dialog
      id="dockstat-onboarding"
      className="w-screen h-screen fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-0"
      aria-modal
      aria-label="DockStat Onboarding"
      open
    >
      <IntroScreen />

      <div className="w-full h-full flex items-center justify-center p-6 md:p-8 lg:p-12">
        <Card className="relative flex flex-col w-full max-w-6xl h-full max-h-[90vh] overflow-hidden shadow-2xl">
          <OnboardingHeader onSkip={skip} />

          <CardBody className="flex-1 overflow-hidden px-0 py-0" scrollShadow>
            <div className="relative h-full w-full overflow-hidden">
              {slides.map((slide, index) => (
                <OnboardingSlide
                  key={slide.title}
                  slide={slide}
                  index={index}
                  currentIndex={currentIndex}
                />
              ))}
            </div>
          </CardBody>

          <OnboardingFooter
            currentIndex={currentIndex}
            totalSlides={slides.length}
            onPrev={goPrev}
            onNext={goNext}
            onFinish={finish}
            slides={slides}
            goToSlide={goToSlide}
          />
        </Card>
      </div>
    </dialog>
  )
}

export const WelcomeToDockStat = ({ setOnBoardingComplete }: OnboardingProps) => {
  return <Onboarding setOnBoardingComplete={setOnBoardingComplete} />
}
