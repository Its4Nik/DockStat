import { AdditionalSettingsSection } from "./sections/additionalSettings"
import { PinnableLinksSection } from "./sections/pinnableLinks"
import { PinnedNavSection } from "./sections/pinnedNav"
import { PluginLinksSection } from "./sections/pluginLinks"
import { useGeneralSettings } from "./sections/useGeneralSettings"
import { Card, CardBody, Divider } from "@dockstat/ui"

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
