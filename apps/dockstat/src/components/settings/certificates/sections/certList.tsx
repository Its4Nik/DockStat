import { Badge, Button, Card, CardBody, Input, Modal } from "@dockstat/ui"
import { Copy, Eye, EyeOff, FileKey, Globe, Key, Lock, ShieldCheck, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  type UpdateCertificateInput,
  useCertificatesMutations,
} from "@/hooks/mutations/certificates"
import type { Certificate } from "@/hooks/queries/certificates"
import { toast } from "@/lib/toast"

const TYPE_META: Record<
  Certificate["type"],
  { badge: "primary" | "success" | "secondary" | "warning"; icon: typeof Key; label: string }
> = {
  ca: { badge: "warning", icon: ShieldCheck, label: "CA" },
  "docker-tls": { badge: "primary", icon: Lock, label: "Docker TLS" },
  "generic-secret": { badge: "secondary", icon: FileKey, label: "Secret" },
  ssh: { badge: "success", icon: Key, label: "SSH" },
  "web-tls": { badge: "primary", icon: Globe, label: "WebUI TLS" },
}

const SOURCE_VARIANT: Record<Certificate["source"], "success" | "primary" | "secondary"> = {
  external: "secondary",
  generated: "success",
  imported: "primary",
}

export function CertificateList({ certificates }: { certificates: Certificate[] }) {
  const { deleteCertificateMutation, revealCertificateMutation, updateCertificateMutation } =
    useCertificatesMutations()

  const [revealed, setRevealed] = useState<{ id: string; data: string; title: string } | null>(null)
  const [showSecret, setShowSecret] = useState(true)
  const [editing, setEditing] = useState<Certificate | null>(null)
  const [filter, setFilter] = useState("")

  const filtered = useMemo(() => {
    if (!filter.trim()) return certificates
    const q = filter.toLowerCase()
    return certificates.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }, [certificates, filter])

  const handleReveal = async (cert: Certificate) => {
    const result = await revealCertificateMutation.mutateAsync({
      body: undefined,
      params: { id: cert.id },
    })
    const privateData =
      (result as { privateData?: string })?.privateData ??
      (result?.data as { privateData?: string } | undefined)?.privateData ??
      ""
    if (!privateData) {
      toast({ description: "No private material available", title: "Empty" })
      return
    }
    setRevealed({ data: privateData, id: cert.id, title: cert.title })
    setShowSecret(true)
  }

  const handleDelete = async (cert: Certificate) => {
    if (window.confirm(`Delete "${cert.title}"? This cannot be undone.`)) {
      await deleteCertificateMutation.mutateAsync({ params: { id: cert.id } })
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ description: "Copied to clipboard", title: "Copied!" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          onChange={setFilter}
          placeholder="Filter by title, type or tag..."
          value={filter}
        />
      </div>

      {filtered.length === 0 ? (
        <Card variant="outlined">
          <CardBody className="py-8 text-center">
            <Key
              className="mx-auto mb-3 text-muted-text"
              size={32}
            />
            <p className="text-sm text-muted-text">No certificates yet</p>
            <p className="text-xs text-muted-text/60 mt-1">
              Generate, import or reference a certificate to get started
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cert) => {
            const meta = TYPE_META[cert.type]
            const Icon = meta.icon
            return (
              <Card
                key={cert.id}
                variant="outlined"
              >
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Icon
                          className="text-accent"
                          size={18}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-primary-text truncate">{cert.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-text mt-0.5">
                          <Badge
                            size="sm"
                            variant={meta.badge}
                          >
                            {meta.label}
                          </Badge>
                          <Badge
                            size="sm"
                            variant={SOURCE_VARIANT[cert.source]}
                          >
                            {cert.source}
                          </Badge>
                          {cert.algorithm && <span className="font-mono">{cert.algorithm}</span>}
                          {cert.fingerprint && (
                            <span
                              className="font-mono opacity-60 truncate max-w-[180px]"
                              title={cert.fingerprint}
                            >
                              {cert.fingerprint}
                            </span>
                          )}
                        </div>
                        {cert.comment && (
                          <p className="text-xs text-muted-text mt-1">{cert.comment}</p>
                        )}
                        {cert.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cert.tags.map((tag) => (
                              <span
                                className="px-1.5 py-0.5 rounded bg-muted/10 text-[10px] text-muted-text"
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {cert.privateData === null && cert.source !== "external" ? null : (
                        <Button
                          disabled={cert.source === "external" && !cert.publicData}
                          onClick={() => handleReveal(cert)}
                          size="sm"
                          variant="ghost"
                        >
                          <Eye size={16} />
                        </Button>
                      )}
                      <Button
                        onClick={() => setEditing(cert)}
                        size="sm"
                        variant="ghost"
                      >
                        <FileKey size={16} />
                      </Button>
                      <Button
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDelete(cert)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {cert.publicData && (
                    <div className="flex items-center gap-2">
                      <pre className="flex-1 text-[11px] font-mono text-muted-text bg-muted/5 rounded-md p-2 max-h-20 overflow-auto whitespace-pre-wrap break-all">
                        {cert.publicData.split("\n").slice(0, 3).join("\n")}
                        {cert.publicData.split("\n").length > 3 ? "\n..." : ""}
                      </pre>
                      <Button
                        onClick={() => handleCopy(cert.publicData as string)}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  )}
                  {cert.externalRef && (
                    <div className="text-xs text-muted-text font-mono bg-muted/5 rounded-md p-2 break-all">
                      ref: {cert.externalRef}
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reveal modal */}
      <Modal
        bodyClasses="space-y-3"
        onClose={() => setRevealed(null)}
        open={!!revealed}
        size="lg"
        title={`Private material — ${revealed?.title ?? ""}`}
      >
        {revealed && (
          <>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSecret((s) => !s)}
                size="sm"
                variant="outline"
              >
                {showSecret ? (
                  <>
                    <EyeOff size={14} />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    Show
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleCopy(revealed.data)}
                size="sm"
                variant="outline"
              >
                <Copy size={14} />
                Copy
              </Button>
            </div>
            <pre
              className={`text-xs font-mono text-primary-text bg-muted/5 rounded-md p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all ${
                showSecret ? "" : "blur-sm select-none"
              }`}
            >
              {revealed.data}
            </pre>
          </>
        )}
      </Modal>

      {/* Edit modal */}
      <EditCertificateModal
        cert={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, patch) => {
          await updateCertificateMutation.mutateAsync({ body: patch, params: { id } })
          setEditing(null)
        }}
      />
    </div>
  )
}

function EditCertificateModal({
  cert,
  onClose,
  onSave,
}: {
  cert: Certificate | null
  onClose: () => void
  onSave: (id: string, patch: UpdateCertificateInput) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [tags, setTags] = useState("")

  useEffect(() => {
    if (cert) {
      setTitle(cert.title)
      setComment(cert.comment ?? "")
      setTags((cert.tags ?? []).join(", "))
    }
  }, [cert])

  return (
    <Modal
      bodyClasses="space-y-3"
      footer={
        <Button
          onClick={() =>
            cert &&
            onSave(cert.id, {
              comment: comment || null,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              title,
            })
          }
          variant="primary"
        >
          Save
        </Button>
      }
      onClose={onClose}
      open={!!cert}
      title="Edit Metadata"
    >
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-muted-text">
          Title
        </span>
        <Input
          onChange={setTitle}
          value={title}
        />
      </div>
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-muted-text">
          Tags (comma separated)
        </span>
        <Input
          onChange={setTags}
          value={tags}
        />
      </div>
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-muted-text">
          Comment
        </span>
        <Input
          onChange={setComment}
          value={comment}
        />
      </div>
    </Modal>
  )
}
