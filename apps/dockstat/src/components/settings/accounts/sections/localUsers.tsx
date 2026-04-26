import { useAuth } from "@dockstat/auth/client"
import { Badge, Button, Card, CardBody, Input } from "@dockstat/ui"
import { Loader2, Shield, Trash2, UserPlus } from "lucide-react"
import { useState } from "react"
import { useAccountsMutations } from "@/hooks/mutations/accounts"
import { parseApiDate, useAccountsQueries } from "@/hooks/queries/accounts"
import { toast } from "@/lib/toast"

export function LocalUsersSection() {
  const { users, usersLoading, refetchUsers } = useAccountsQueries()
  const { createUserMutation, deleteUserMutation } = useAccountsMutations()
  const { user: loggedInUser } = useAuth()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserPass, setNewUserPass] = useState("")

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      toast({
        description: "Please enter a username",
        title: "Validation Error",
      })
      return
    }

    if (newUserName.trim().length < 3) {
      toast({
        description: "Username must be at least 3 characters",
        title: "Validation Error",
      })
      return
    }

    if (newUserPass.length < 8) {
      toast({
        description: "Password must be at least 8 characters",
        title: "Validation Error",
      })
      return
    }

    try {
      await createUserMutation.mutateAsync({
        name: newUserName.trim(),
        pass: newUserPass,
      })

      setNewUserName("")
      setNewUserPass("")
      setShowCreateDialog(false)
      refetchUsers()
    } catch (error) {
      console.error("Failed to create user:", error)
    }
  }

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
          onClick={() => setShowCreateDialog(!showCreateDialog)}
          size="sm"
          variant="outline"
        >
          <UserPlus size={16} />
          Add User
        </Button>
      </div>

      {showCreateDialog && (
        <Card variant="outlined">
          <CardBody className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="user-name"
              >
                Username
              </label>
              <Input
                className="bg-white/5!"
                id="user-name"
                onChange={(v) => setNewUserName(v)}
                placeholder="e.g., admin"
                value={newUserName}
              />
              <p className="text-xs text-white/30 mt-1">Must be between 3 and 50 characters</p>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] mb-1.5 text-white/30"
                htmlFor="user-pass"
              >
                Password
              </label>
              <Input
                className="bg-white/5!"
                id="user-pass"
                onChange={(v) => setNewUserPass(v)}
                placeholder="Minimum 8 characters"
                type="password"
                value={newUserPass}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={createUserMutation.isPending}
                onClick={handleCreateUser}
                variant="primary"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2
                      className="animate-spin mr-2"
                      size={16}
                    />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
              <Button
                disabled={createUserMutation.isPending}
                onClick={() => setShowCreateDialog(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {users.length === 0 && !showCreateDialog ? (
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
                      Created: {parseApiDate(user.createdAt)?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {(loggedInUser?.name || loggedInUser?.sub) !== user.name ? (
                  <Button
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 size={16} />
                  </Button>
                ) : (
                  <Badge
                    outlined
                    rounded
                    size="lg"
                  >
                    Currently logged in
                  </Badge>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
