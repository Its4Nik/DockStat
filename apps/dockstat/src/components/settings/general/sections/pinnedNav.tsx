import { useGlobalBusy } from "@/hooks/useGlobalBusy"
import { Button, Card } from "@dockstat/ui"
import { LinkIcon, X } from "lucide-react"

type PinnedNavSectionProps = {
  pinnedLinks: { slug: string; path: string }[]
  unpinLink: (slug: string, path: string) => void
}

export function PinnedNavSection({ pinnedLinks, unpinLink }: PinnedNavSectionProps) {
  const busy = useGlobalBusy()
  return (
    <div>
      <Card size="sm" variant="outlined" className="flex gap-2 mb-4">
        <div className="mx-auto gap-2">
          <div className="flex items-center gap-2">
            <LinkIcon size={24} className="text-accent" />
            <h2 className="text-2xl font-semibold text-muted-text">Pinned Links</h2>
          </div>
        </div>
      </Card>

      {pinnedLinks.length === 0 ? (
        <Card variant="dark" className="text-center py-12 text-muted-text">
          No pinned links. Pin frequently used pages for quick access in the navbar.
        </Card>
      ) : (
        <Card variant="dark" className="grid gap-3 p-4">
          {pinnedLinks.map((link) => (
            <div
              key={`${link.slug}-${link.path}`}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-accent/10">
                  <LinkIcon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{link.slug}</div>
                  <div className="text-sm text-muted-text truncate">{link.path}</div>
                </div>
              </div>

              <Button
                size="sm"
                variant="danger"
                onClick={() => unpinLink(link.slug, link.path)}
                disabled={busy}
                className="flex items-center"
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
