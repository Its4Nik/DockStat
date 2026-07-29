import { Badge, Button, Card, CardBody } from "@dockstat/ui"
import { Plus, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { useCertificatesQuery } from "@/hooks/queries/certificates"
import { CertificateList } from "./sections/certList"
import { CreateCertificateDialog } from "./sections/createDialog"

export const CertificatesSettingsSlide = () => {
  const { certificates, isLoading } = useCertificatesQuery()
  const [showCreate, setShowCreate] = useState(false)

  const counts = certificates.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-6">
      <div>
        <Card variant="elevated">
          <Card
            className="flex gap-2"
            size="sm"
            variant="outlined"
          >
            <div className="mx-auto gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="text-accent"
                  size={24}
                />
                <h2 className="text-2xl font-semibold text-muted-text">Certificates & Keys</h2>
              </div>
            </div>
          </Card>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  size="sm"
                  variant="secondary"
                >
                  {certificates.length} total
                </Badge>
                {Object.entries(counts).map(([type, count]) => (
                  <Badge
                    key={type}
                    size="sm"
                    variant="primary"
                  >
                    {type}: {count}
                  </Badge>
                ))}
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => setShowCreate(true)}
                size="sm"
                variant="primary"
              >
                <Plus size={16} />
                Add Certificate
              </Button>
            </div>

            {isLoading ? (
              <Card variant="outlined">
                <CardBody className="py-8 text-center text-muted-text">
                  Loading certificates...
                </CardBody>
              </Card>
            ) : (
              <CertificateList certificates={certificates} />
            )}
          </CardBody>
        </Card>
      </div>

      <CreateCertificateDialog
        onClose={() => setShowCreate(false)}
        open={showCreate}
      />
    </div>
  )
}
