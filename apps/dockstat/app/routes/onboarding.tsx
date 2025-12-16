import { WelcomeToDockStat } from "@dockstat/ui/welcome"
import { useState } from "react"
import { Navigate } from "react-router"

export default function Onboarding() {
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  if (onboardingComplete) {
    return <Navigate to="/" replace />
  }

  return <WelcomeToDockStat setOnBoardingComplete={setOnboardingComplete} />
}
