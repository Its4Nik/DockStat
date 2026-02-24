import { Card, CardBody, Divider } from "@dockstat/ui"
import { Link } from "lucide-react"
import { AdditionalSettingsSection } from "./sections/additionalSettings"
import { PinnableLinksSection } from "./sections/pinnableLinks"
import { PinnedNavSection } from "./sections/pinnedNav"
import { PluginLinksSection } from "./sections/pluginLinks"
import { useGeneralSettings } from "./sections/useGeneralSettings"

export const GeneralSettingsSlide = () => {
  const {
    additionalSettings,
    availableLinks,
    pinLink,
    pinnedLinks,
    showRamUsageInNavbar,
    pluginLinks,
    unpinLink,
    allNavLinks,
  } = useGeneralSettings()

  return (
    <div className="space-y-6">
      <div>
        <Card variant="elevated">
          <Card size="sm" variant="outlined" className="flex gap-2">
            <div className="mx-auto gap-2">
              <div className="flex items-center gap-2">
                <Link size={24} className="text-accent" />
                <h2 className="text-2xl font-semibold text-muted-text">Link Settings</h2>
              </div>
            </div>
          </Card>
          <CardBody>
            <div className="flex flex-wrap  gap-4 mb-4">
              <div className="flex-1">
                <PinnedNavSection pinnedLinks={pinnedLinks} unpinLink={unpinLink} />
              </div>
              <Divider orientation="vertical" className="mx-2" />
              <div className="flex-1">
                <PinnableLinksSection availableLinks={availableLinks} pinLink={pinLink} />
              </div>
              {pluginLinks.length >= 1 && (
                <>
                  <Divider orientation="vertical" className="mx-2" />

                  <div className="flex-1">
                    <PluginLinksSection pluginLinks={pluginLinks} allNavLinks={allNavLinks} />
                  </div>
                </>
              )}
            </div>

            <Divider className="my-4" />

            <AdditionalSettingsSection
              additionalSettings={additionalSettings || {}}
              setShowRamUsageInNavbar={showRamUsageInNavbar}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
