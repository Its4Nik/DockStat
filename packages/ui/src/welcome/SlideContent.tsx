import { Card, CardBody, CardFooter } from "../components/Card/Card"
import { SlideBullet } from "./SlideBullet"
import { Button } from "../components/Button/Button"
import type { Slide } from "./types"

export const SlideContent = ({ slide, isActive }: { slide: Slide; isActive: boolean }) => (
  <div className="flex flex-row gap-4 items-start justify-between">
    <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {slide.bullets?.map((bullet, idx) => (
          <SlideBullet key={bullet.title} bullet={bullet} index={idx} isActive={isActive} />
        ))}
      </div>
    </div>

    {slide.footer ? (
      <aside className="col-span-1 flex flex-col gap-4">
        <Card className="w-full md:sticky md:top-6" size="sm">
          <CardBody className="p-3">
            <Button fullWidth size="sm" onClick={() => alert("Open docs (placeholder)")}>
              View docs
            </Button>
          </CardBody>

          <CardFooter className="p-3 text-xs text-slate-400">{slide.footer}</CardFooter>
        </Card>
      </aside>
    ) : (
      <div className="hidden md:block col-span-1" />
    )}
  </div>
)
