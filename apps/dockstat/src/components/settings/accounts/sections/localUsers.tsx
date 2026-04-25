import { Button, Card, CardBody } from "@dockstat/ui"
import { Loader2, Shield, Trash2, UserPlus } from "lucide-react"
import { useAccountsMutations } from "@/hooks/mutations/accounts"
import { useAccountsQueries } from "@/hooks/queries/accounts"

export function LocalUsersSection() {
  const { users, usersLoading, refetchUsers } = useAccountsQueries()
  const { deleteUserMutation } = useAccountsMutations()

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      await deleteUserMutation.mutateAsync({ body: undefined, params: { userId } })
      refetchUsers()
    }
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2
          className="animate-spin text-muted-text"
          size={24}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white/90">Local Users</h3>
          <p className="text-sm text-white/40">Manage local user accounts</p>
        </div>
        <Button
          className="flex items-center gap-2"
          size="sm"
          variant="outline"
        >
          <UserPlus size={16} />
          Add User
        </Button>
      </div>

      {users.length === 0 ? (
        <Card variant="outlined">
          <CardBody className="py-8 text-center">
            <Shield
              className="mx-auto mb-3 text-muted-text/50"
              size={32}
            />
            <p className="text-sm text-white/40">No local users found</p>
            <p className="text-xs text-white/20 mt-1">Create a local user account to get started</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card
              key={user.id}
              variant="outlined"
            >
              <CardBody className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Shield
                      className="text-accent"
                      size={18}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">{user.name}</p>
                    <p className="text-xs text-white/40">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
