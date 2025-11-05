import { useEffect, useState } from "react";
import { Card, CardBody } from "../components/Card/Card";
import type { OnboardingProps } from "./types";
import { slides } from "./CONSTS";
import { OnboardingHeader } from "./OnboardingHeader";
import { OnboardingSlide } from "./OnboardingSlide";
import { OnboardingFooter } from "./OnboardingFooter";
import IntroScreen from "./Intro";

export function Onboarding({ setOnBoardingComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));
  const goToSlide = (index: number) => setCurrentIndex(index);
  const finish = () => setOnBoardingComplete(true);
  const skip = () => setOnBoardingComplete(true);

  return (
    <dialog
      id="dockstat-onboarding"
      className="w-screen h-screen fixed inset-0 z-50 flex items-center justify-center bg-black p-4 sm:p-6 md:p-10"
      aria-modal
      aria-label="DockStat Onboarding"
      open
    >
      <IntroScreen />

      <Card className="relative flex flex-col w-full max-w-4xl h-[85vh] overflow-hidden">
        <OnboardingHeader
          onSkip={skip}
        />

        <CardBody className="flex-1 relative p-4 sm:p-6 md:p-7 overflow-y-auto">
          <div className="relative flex-1 min-h-full overflow-x-hidden">
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
    </dialog>
  );
}

export const WelcomeToDockStat = ({ setOnBoardingComplete }: OnboardingProps) => {
  return <Onboarding setOnBoardingComplete={setOnBoardingComplete} />;
};
