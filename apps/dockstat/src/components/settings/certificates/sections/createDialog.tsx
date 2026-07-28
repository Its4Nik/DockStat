import { Badge, Button, Input, Modal, Select } from "@dockstat/ui"
import { useState } from "react"
import {
  type ExternalCertificateInput,
  type GenerateCertificateInput,
  type ImportCertificateInput,
  useCertificatesMutations,
} from "@/hooks/mutations/certificates"
import type { CertificateType } from "@/hooks/queries/certificates"
import { toast } from "@/lib/toast"

type CreateMode = "generate" | "import" | "external"

const TYPE_OPTIONS: { value: CertificateType; label: string }[] = [
  { label: "SSH Key", value: "ssh" },
  { label: "Docker TLS", value: "docker-tls" },
  { label: "WebUI TLS", value: "web-tls" },
  { label: "Certificate Authority", value: "ca" },
  { label: "Generic Secret", value: "generic-secret" },
]

const ALGO_OPTIONS: { value: string; label: string }[] = [
  { label: "Auto (recommended)", value: "" },
  { label: "Ed25519", value: "ed25519" },
  { label: "RSA", value: "rsa" },
  { label: "ECDSA (P-256)", value: "ecdsa" },
  { label: "Self-signed RSA", value: "self-signed-rsa" },
]

const FORMAT_OPTIONS = [
  { label: "PEM", value: "pem" },
  { label: "OpenSSH", value: "openssh" },
  { label: "DER", value: "der" },
]

export function CreateCertificateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { generateCertificateMutation, importCertificateMutation, addExternalCertificateMutation } =
    useCertificatesMutations()

  const [mode, setMode] = useState<CreateMode>("generate")

  // shared
  const [title, setTitle] = useState("")
  const [type, setType] = useState<CertificateType>("ssh")
  const [comment, setComment] = useState("")
  const [tags, setTags] = useState("")

  // generate
  const [algorithm, setAlgorithm] = useState("")
  const [commonName, setCommonName] = useState("")
  const [subjectAltNames, setSubjectAltNames] = useState("")
  const [validityDays, setValidityDays] = useState("365")
  const [rsaKeySize, setRsaKeySize] = useState("2048")

  // import
  const [privateData, setPrivateData] = useState("")
  const [publicData, setPublicData] = useState("")
  const [format, setFormat] = useState("pem")

  // external
  const [externalRef, setExternalRef] = useState("")

  const reset = () => {
    setTitle("")
    setType("ssh")
    setComment("")
    setTags("")
    setAlgorithm("")
    setCommonName("")
    setSubjectAltNames("")
    setValidityDays("365")
    setRsaKeySize("2048")
    setPrivateData("")
    setPublicData("")
    setFormat("pem")
    setExternalRef("")
  }

  const close = () => {
    reset()
    onClose()
  }

  const parseTags = (s: string): string[] =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

  const isTlsType = type === "docker-tls" || type === "web-tls" || type === "ca"

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({ description: "A title is required", title: "Validation Error" })
      return
    }
    const input: GenerateCertificateInput = {
      comment: comment || null,
      tags: parseTags(tags),
      title,
      type,
      ...(algorithm ? { algorithm: algorithm as GenerateCertificateInput["algorithm"] } : {}),
      ...(isTlsType
        ? {
            commonName: commonName || title,
            rsaKeySize: Number(rsaKeySize) || 2048,
            subjectAltNames: subjectAltNames ? subjectAltNames.split(",").map((s) => s.trim()) : [],
            validityDays: Number(validityDays) || 365,
          }
        : {}),
      ...(type === "ssh" && algorithm === "rsa" ? { rsaKeySize: Number(rsaKeySize) || 2048 } : {}),
    }
    await generateCertificateMutation.mutateAsync(input)
    close()
  }

  const handleImport = async () => {
    if (!title.trim() || !privateData.trim()) {
      toast({ description: "Title and private material are required", title: "Validation Error" })
      return
    }
    const input: ImportCertificateInput = {
      comment: comment || null,
      format: format as ImportCertificateInput["format"],
      privateData,
      publicData: publicData || undefined,
      tags: parseTags(tags),
      title,
      type,
    }
    await importCertificateMutation.mutateAsync(input)
    close()
  }

  const handleExternal = async () => {
    if (!title.trim() || !externalRef.trim()) {
      toast({ description: "Title and reference are required", title: "Validation Error" })
      return
    }
    const input: ExternalCertificateInput = {
      comment: comment || null,
      externalRef,
      publicData: publicData || undefined,
      tags: parseTags(tags),
      title,
      type,
    }
    await addExternalCertificateMutation.mutateAsync(input)
    close()
  }

  const tabs: { id: CreateMode; label: string }[] = [
    { id: "generate", label: "Generate" },
    { id: "import", label: "Import" },
    { id: "external", label: "External Ref" },
  ]

  const pending =
    generateCertificateMutation.isPending ||
    importCertificateMutation.isPending ||
    addExternalCertificateMutation.isPending

  return (
    <Modal
      bodyClasses="space-y-4"
      footer={
        <div className="flex gap-2 w-full">
          <Button
            className="flex-1"
            disabled={pending}
            onClick={
              mode === "generate"
                ? handleGenerate
                : mode === "import"
                  ? handleImport
                  : handleExternal
            }
            variant="primary"
          >
            {pending
              ? "Working..."
              : mode === "generate"
                ? "Generate"
                : mode === "import"
                  ? "Import"
                  : "Register"}
          </Button>
          <Button
            disabled={pending}
            onClick={close}
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      }
      onClose={close}
      open={open}
      size="lg"
      title="Add Certificate"
    >
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === tab.id
                ? "bg-accent/20 text-accent"
                : "bg-muted/10 text-muted-text hover:text-primary-text"
            }`}
            key={tab.id}
            onClick={() => setMode(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Title">
          <Input
            onChange={setTitle}
            placeholder="e.g. prod-docker-client"
            value={title}
          />
        </Field>
        <Field label="Type">
          <Select
            onChange={(v) => setType(v as CertificateType)}
            options={TYPE_OPTIONS}
            value={type}
          />
        </Field>
      </div>

      {mode === "generate" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Algorithm">
              <Select
                onChange={setAlgorithm}
                options={ALGO_OPTIONS}
                value={algorithm}
              />
            </Field>
            {(type === "ssh" && algorithm === "rsa") || isTlsType ? (
              <Field label="RSA Key Size">
                <Select
                  onChange={setRsaKeySize}
                  options={[
                    { label: "2048", value: "2048" },
                    { label: "4096", value: "4096" },
                  ]}
                  value={rsaKeySize}
                />
              </Field>
            ) : null}
          </div>
          {isTlsType && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Common Name">
                <Input
                  onChange={setCommonName}
                  placeholder={title || "docker.local"}
                  value={commonName}
                />
              </Field>
              <Field label="Validity (days)">
                <Input
                  onChange={setValidityDays}
                  type="number"
                  value={validityDays}
                />
              </Field>
            </div>
          )}
          {isTlsType && (
            <Field label="Subject Alt Names (comma separated)">
              <Input
                onChange={setSubjectAltNames}
                placeholder="docker.local,10.0.0.5"
                value={subjectAltNames}
              />
            </Field>
          )}
          <Badge
            size="sm"
            variant="secondary"
          >
            Private material will be encrypted at rest
          </Badge>
        </>
      )}

      {mode === "import" && (
        <>
          <Field label="Format">
            <Select
              onChange={setFormat}
              options={FORMAT_OPTIONS}
              value={format}
            />
          </Field>
          <Field label="Public Material (optional)">
            <textarea
              className="w-full h-24 px-3 py-2 rounded-md bg-muted/5 border border-muted/20 text-sm font-mono text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              onChange={(e) => setPublicData(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE----- or ssh-ed25519 ..."
              value={publicData}
            />
          </Field>
          <Field label="Private Material (required)">
            <textarea
              className="w-full h-32 px-3 py-2 rounded-md bg-muted/5 border border-muted/20 text-sm font-mono text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/50"
              onChange={(e) => setPrivateData(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY----- ..."
              value={privateData}
            />
          </Field>
        </>
      )}

      {mode === "external" && (
        <Field label="External Reference (path / URI)">
          <Input
            onChange={setExternalRef}
            placeholder="/etc/dockstat/certs/docker-client.key"
            value={externalRef}
          />
        </Field>
      )}

      <Field label="Tags (comma separated)">
        <Input
          onChange={setTags}
          placeholder="production, docker"
          value={tags}
        />
      </Field>
      <Field label="Comment">
        <Input
          onChange={setComment}
          placeholder="Notes about this credential"
          value={comment}
        />
      </Field>
    </Modal>
  )
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-muted-text">
        {label}
      </span>
      {children}
    </div>
  )
}
