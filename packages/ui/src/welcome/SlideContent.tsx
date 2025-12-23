import { Button } from "../components/Button/Button"
import { Card, CardBody, CardFooter } from "../components/Card/Card"
import { SlideBullet } from "./SlideBullet"
import type { Slide } from "./types"

export const SlideContent = ({ slide, isActive }: { slide: Slide; isActive: boolean }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
    <div className="lg:col-span-2 flex flex-col gap-5">
      {slide.bullets?.map((bullet, idx) => (
        <SlideBullet key={bullet.title} bullet={bullet} index={idx} isActive={isActive} />
      ))}
    </div>

    {slide.footer && (
      <aside className="lg:col-span-1 flex flex-col">
        <Card className="w-full h-fit lg:sticky lg:top-0" size="sm">
          <CardBody className="p-5">
            <Button fullWidth size="md" onClick={() => alert("Open docs (placeholder)")}>
              View Documentation
            </Button>
          </CardBody>

          <CardFooter className="p-5 text-sm text-slate-300 leading-relaxed border-t border-slate-700">
            {slide.footer}
          </CardFooter>
        </Card>
      </aside>
    )}
  </div>
)
