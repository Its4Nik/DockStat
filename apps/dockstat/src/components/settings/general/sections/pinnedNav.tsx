import { Button, Card } from "@dockstat/ui"
import { LinkIcon, Pin, X } from "lucide-react"
import { useGlobalBusy } from "@/hooks/useGlobalBusy"

type PinnedNavSectionProps = {
  pinnedLinks: { slug: string; path: string }[]
  unpinLink: (slug: string, path: string) => void
}

export function PinnedNavSection({ pinnedLinks, unpinLink }: PinnedNavSectionProps) {
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
            <Pin
              className="text-accent rotate-45"
              size={24}
            />
            <h2 className="text-2xl font-semibold text-muted-text">Pinned Links</h2>
          </div>
        </div>
      </Card>

      {pinnedLinks.length === 0 ? (
        <Card
          className="text-center py-12 text-muted-text"
          variant="dark"
        >
          No pinned links. Pin frequently used pages for quick access in the navbar.
        </Card>
      ) : (
        <Card
          className="grid gap-3 p-4 h-48 resize-y overflow-y-scroll"
          variant="dark"
        >
          {pinnedLinks.map((link) => (
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
                className="flex items-center"
                disabled={busy}
                onClick={() => unpinLink(link.slug, link.path)}
                size="sm"
                variant="danger"
              >
                <X size={16} />
                Unpin
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
