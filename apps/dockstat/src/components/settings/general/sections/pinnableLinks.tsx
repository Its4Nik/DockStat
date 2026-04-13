import { Button, Card } from "@dockstat/ui"
import { LinkIcon, Pin } from "lucide-react"
import { useGlobalBusy } from "@/hooks/useGlobalBusy"

type PinnableLinksSectionProps = {
  availableLinks: { slug: string; path: string }[]
  pinLink: (slug: string, path: string) => void
}

export function PinnableLinksSection({ availableLinks, pinLink }: PinnableLinksSectionProps) {
  const busy = useGlobalBusy()
  return (
    <div>
      <Card
        className="flex gap-2 mb-4"
        size="sm"
        variant="flat"
      >
        <div className="mx-auto gap-2">
          <div className="flex items-center gap-2">
            <LinkIcon
              className="text-accent"
              size={24}
            />
            <h2 className="text-2xl font-semibold text-muted-text">Available Links</h2>
          </div>
        </div>
      </Card>

      {availableLinks.length === 0 ? (
        <Card
          className="text-center py-12 text-muted-text"
          variant="dark"
        >
          All available links are already pinned.
        </Card>
      ) : (
        <Card
          className="grid gap-3 p-4 h-48 resize-y overflow-y-scroll"
          variant="dark"
        >
          {availableLinks.map((link) => (
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors"
              key={`${link.slug}-${link.path}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-accent/10">
                  <LinkIcon
                    className="text-accent"
                    size={18}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary-text">{link.slug}</div>
                  <div className="text-sm text-muted-text truncate">{link.path}</div>
                </div>
              </div>

              <Button
                className="flex items-center gap-2"
                disabled={busy}
                onClick={() => pinLink(link.slug, link.path)}
                size="sm"
                variant="primary"
              >
                <Pin size={16} />
                Pin to Nav
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
