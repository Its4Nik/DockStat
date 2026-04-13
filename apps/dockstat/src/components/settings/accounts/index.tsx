import { Card, CardBody, Divider } from "@dockstat/ui"
import { Key, Settings, Shield } from "lucide-react"
import { AdminModal } from "./sections/adminModal"
import { ApiKeysSection } from "./sections/apiKeys"
import { OAuthProvidersSection } from "./sections/oauthProviders"
import { useAccounts } from "./sections/useAccounts"
import { UsersSection } from "./sections/users"

export const AccountsSettingsSlide = () => {
  const {
    apiKeys,
    users,
    oauthProviders,
    isLoading,
    showAdminModal,
    handleAdminModalChoice,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    createUser,
    updateUser,
    deleteUser,
    banUser,
    unbanUser,
    updateUserRole,
    addOAuthProvider,
    removeOAuthProvider,
  } = useAccounts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-text">Loading accounts...</div>
      </div>
    )
  }

  return (
    <>
      <AdminModal
        onChoice={handleAdminModalChoice}
        onClose={() => handleAdminModalChoice("ask-later")}
        open={showAdminModal}
      />

      <div className="space-y-6">
        {/* Users Section */}
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
                  <h2 className="text-2xl font-semibold text-primary-text">User Management</h2>
                </div>
              </div>
            </Card>
            <CardBody>
              <UsersSection
                banUser={banUser}
                createUser={createUser}
                deleteUser={deleteUser}
                unbanUser={unbanUser}
                updateUser={updateUser}
                updateUserRole={updateUserRole}
                users={users}
              />
            </CardBody>
          </Card>
        </div>

        <Divider variant="dotted" />

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
                  <Key
                    className="text-accent"
                    size={24}
                  />
                  <h2 className="text-2xl font-semibold text-primary-text">API Keys</h2>
                </div>
              </div>
            </Card>
            <CardBody>
              <ApiKeysSection
                apiKeys={apiKeys}
                createApiKey={createApiKey}
                deleteApiKey={deleteApiKey}
                toggleApiKey={toggleApiKey}
              />
            </CardBody>
          </Card>
        </div>

        <Divider variant="dotted" />

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
                  <Settings
                    className="text-accent"
                    size={24}
                  />
                  <h2 className="text-2xl font-semibold text-primary-text">OAuth Providers</h2>
                </div>
              </div>
            </Card>
            <CardBody>
              <OAuthProvidersSection
                addOAuthProvider={addOAuthProvider}
                oauthProviders={oauthProviders}
                removeOAuthProvider={removeOAuthProvider}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
