import { Button, Card, CardBody, CardHeader, Checkbox, Input } from "@dockstat/ui"
import { motion } from "framer-motion"
import { GitBranch, Globe, Pencil, Shield, Store } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type {
  ActionResponse,
  EditRepositoryFormProps,
  RepoType,
  VerificationPolicy,
} from "../types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

const repoTypeOptions: { value: RepoType; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "gitea", label: "Gitea" },
  { value: "http", label: "HTTP" },
  { value: "local", label: "Local" },
]

const policyOptions: { value: VerificationPolicy; label: string }[] = [
  { value: "strict", label: "Strict - Require verification" },
  { value: "relaxed", label: "Relaxed - No verification" },
]

export function EditRepositoryForm({ repository, onSuccess, onCancel }: EditRepositoryFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"
  const previousState = useRef(fetcher.state)

  const [name, setName] = useState(repository.name)
  const [source, setSource] = useState(repository.source)
  const [type, setType] = useState<RepoType>(repository.type)
  const [policy, setPolicy] = useState<VerificationPolicy>(repository.policy)
  const [verificationApi, setVerificationApi] = useState(repository.verification_api || "")
  const [isVerified, setIsVerified] = useState(repository.isVerified)

  const isFormValid = name.trim().length > 0 && source.trim().length > 0

  // Check if form has changes
  const hasChanges =
    name !== repository.name ||
    source !== repository.source ||
    type !== repository.type ||
    policy !== repository.policy ||
    verificationApi !== (repository.verification_api || "") ||
    isVerified !== repository.isVerified

  // Handle fetcher response
  useEffect(() => {
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Repository updated", {
          description:
            fetcher.data.message || `Repository "${name}" has been updated successfully.`,
          duration: 5000,
        })
        onSuccess?.()
      } else {
        toast.error("Failed to update repository", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, name, onSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || !hasChanges) return

    fetcher.submit(
      {
        intent: "repository:edit",
        id: repository.id.toString(),
        name: name.trim(),
        source: source.trim(),
        type,
        policy,
        verificationApi: verificationApi.trim() || "",
        isVerified: isVerified.toString(),
      },
      { method: "post" }
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <Card variant="default" size="md" className="w-full">
        <CardHeader className="pb-4">
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-badge-warning-bg">
              <Pencil size={22} className="text-badge-warning-text" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">Edit Repository</h2>
              <p className="text-sm text-muted-text mt-0.5">
                Modify settings for "{repository.name}"
              </p>
            </div>
          </motion.div>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Repository Name */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="repo-name" className="text-sm font-medium text-secondary-text">
                  Repository Name
                  <span className="text-error ml-0.5">*</span>
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(value) => setName(value)}
                  placeholder="e.g., DockStore Official"
                />
              </motion.div>

              {/* Repository Source */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="repo-source" className="text-sm font-medium text-secondary-text">
                  Source
                  <span className="text-error ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={source}
                    onChange={(value) => setSource(value)}
                    placeholder="e.g., owner/repo or https://github.com/owner/repo"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {type === "github" && <GitBranch size={16} className="text-muted-text" />}
                    {type === "gitlab" && <GitBranch size={16} className="text-orange-500" />}
                    {type === "http" && <Globe size={16} className="text-muted-text" />}
                  </div>
                </div>
                <p className="text-xs text-muted-text">
                  Supports GitHub (owner/repo), GitLab, Gitea, or direct HTTP URLs
                </p>
              </motion.div>

              {/* Repository Type */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="repo-type" className="text-sm font-medium text-secondary-text">
                  Repository Type
                </label>
                <select
                  id="repo-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as RepoType)}
                  className="w-full px-3 py-2 rounded-md bg-card-flat-bg border border-card-outlined-border text-primary-text focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {repoTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </motion.div>

              {/* Verification Policy */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="repo-policy" className="text-sm font-medium text-secondary-text">
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} />
                    Verification Policy
                  </div>
                </label>
                <select
                  id="repo-policy"
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value as VerificationPolicy)}
                  className="w-full px-3 py-2 rounded-md bg-card-flat-bg border border-card-outlined-border text-primary-text focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {policyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-text">
                  {policy === "strict"
                    ? "Plugins must be verified against cached hashes before use"
                    : "Plugins are trusted without verification"}
                </p>
              </motion.div>

              {/* Verification API (only for strict policy) */}
              {policy === "strict" && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <label
                    htmlFor="repo-verification-api"
                    className="text-sm font-medium text-secondary-text"
                  >
                    Verification API URL
                    <span className="text-muted-text ml-1">(optional)</span>
                  </label>
                  <Input
                    type="url"
                    value={verificationApi}
                    onChange={(value) => setVerificationApi(value)}
                    placeholder="e.g., https://api.example.com/verify"
                  />
                  <p className="text-xs text-muted-text">
                    URL to fetch verification hashes from. Leave empty to manage hashes manually.
                  </p>
                </motion.div>
              )}

              {/* Mark as Verified Toggle */}
              <motion.div variants={itemVariants}>
                <Checkbox
                  id="repo-verified"
                  checked={isVerified}
                  onChange={(checked) => setIsVerified(checked)}
                  label="Mark repository as verified"
                />
                <p className="text-xs text-muted-text mt-1 ml-6">
                  Verified repositories are trusted sources for plugins
                </p>
              </motion.div>

              {/* Repository Info */}
              <motion.div variants={itemVariants} className="space-y-2">
                <p className="text-xs font-medium text-muted-text uppercase tracking-wide">
                  Repository Info
                </p>
                <div className="flex items-center gap-2 p-3 rounded-md bg-card-flat-bg">
                  <Store size={16} className="text-muted-text" />
                  <div className="text-xs text-muted-text">
                    <span className="font-medium">ID:</span> {repository.id}
                    {repository.hashes && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium">Cached Hashes:</span>{" "}
                        {Object.keys(repository.hashes).length} plugins
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-end gap-3 pt-4 border-t border-divider"
              >
                {onCancel && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!isFormValid || !hasChanges || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Pencil size={16} />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </motion.div>
            </div>
          </form>
        </CardBody>
      </Card>
    </motion.div>
  )
}
