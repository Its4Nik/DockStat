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
      <Card size="sm" variant="flat" className="flex gap-2 mb-4">
        <div className="mx-auto gap-2">
          <div className="flex items-center gap-2">
            <LinkIcon size={24} className="text-accent" />
            <h2 className="text-2xl font-semibold text-muted-text">Available Links</h2>
          </div>
        </div>
      </Card>

      {availableLinks.length === 0 ? (
        <Card variant="dark" className="text-center py-12 text-muted-text">
          All available links are already pinned.
        </Card>
      ) : (
        <Card variant="dark" className="grid gap-3 p-4 h-48 resize-y overflow-y-scroll">
          {availableLinks.map((link) => (
            <div
              key={`${link.slug}-${link.path}`}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-accent/10">
                  <LinkIcon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary-text">{link.slug}</div>
                  <div className="text-sm text-muted-text truncate">{link.path}</div>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => pinLink(link.slug, link.path)}
                disabled={busy}
                className="flex items-center gap-2"
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
