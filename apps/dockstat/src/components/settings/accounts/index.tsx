import { Card, CardBody, Divider } from "@dockstat/ui"
import { Shield } from "lucide-react"
import { ApiKeysSection } from "./sections/apiKeys"
import { LocalUsersSection } from "./sections/localUsers"
import { OAuthProvidersSection } from "./sections/oAuthProviders"

export const AccountsSettingsSlide = () => {
  return (
    <div className="space-y-6">
      {/* Local Users Section */}
      <div>
        <Card variant="elevated">
          <Card
            className="flex gap-2"
            size="sm"
            variant="outlined"
          >
            <div className="mx-auto gap-2">
              <div className="flex items-center gap-2">
                <Shield
                  className="text-accent"
                  size={24}
                />
                <h2 className="text-2xl font-semibold text-muted-text">Local Users</h2>
              </div>
            </div>
          </Card>
          <CardBody>
            <LocalUsersSection />
          </CardBody>
        </Card>
      </div>

      <Divider className="my-4" />

      {/* API Keys Section */}
      <div>
        <Card variant="elevated">
          <Card
            className="flex gap-2"
            size="sm"
            variant="outlined"
          >
            <div className="mx-auto gap-2">
              <div className="flex items-center gap-2">
                <Shield
                  className="text-accent"
                  size={24}
                />
                <h2 className="text-2xl font-semibold text-muted-text">API Keys</h2>
              </div>
            </div>
          </Card>
          <CardBody>
            <ApiKeysSection />
          </CardBody>
        </Card>
      </div>

      <Divider className="my-4" />

      {/* OAuth Providers Section */}
      <div>
        <Card variant="elevated">
          <Card
            className="flex gap-2"
            size="sm"
            variant="outlined"
          >
            <div className="mx-auto gap-2">
              <div className="flex items-center gap-2">
                <Shield
                  className="text-accent"
                  size={24}
                />
                <h2 className="text-2xl font-semibold text-muted-text">OAuth Providers</h2>
              </div>
            </div>
          </Card>
          <CardBody>
            <OAuthProvidersSection />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
