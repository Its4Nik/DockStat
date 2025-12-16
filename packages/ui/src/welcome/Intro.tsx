import { useEffect, useState } from "react"
import DockStatLogo from "../../public/DockStat2-06.png"
import { Card, CardBody } from "../components/Card/Card"

export default function IntroScreen({ message }: { message?: string }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-transparent overflow-hidden">
      {/* Background stripes */}
      <div className="absolute inset-0 flex bg-transparent">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={String(i)}
            className="flex-1 bg-linear-to-b from-zinc-800 to-zinc-900 animate-float-up"
            style={{
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="animate-fade-in-up text-white text-6xl font-bold drop-shadow-lg"
          style={{
            animationDelay: "0.5s",
          }}
        >
          <Card className="relative">
            <img src={DockStatLogo} className="w-40 h-40" alt="DockStat Logo" />
            {message ? (
              <CardBody>
                <p className="text-sm">{message}</p>
              </CardBody>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  )
}
