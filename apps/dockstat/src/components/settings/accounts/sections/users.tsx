import type { Column } from "@dockstat/ui"
import { Badge, Button, Card, CardBody, Divider, Input, Modal, Table } from "@dockstat/ui"
import {
  Ban,
  CheckCircle,
  Crown,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react"
import { useState } from "react"
import type { User } from "./useAccounts"

interface UsersSectionProps {
  users: User[]
  createUser: (data: { email: string; password: string; name: string }) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  banUser: (id: string, reason: string) => void
  unbanUser: (id: string) => void
  updateUserRole: (id: string, role: "admin" | "user") => void
}

export function UsersSection({
  users,
  createUser,
  deleteUser,
  banUser,
  unbanUser,
  updateUserRole,
}: UsersSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")

  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")

  const handleCreate = () => {
    if (!newUserName || !newUserEmail || !newUserPassword) return
    createUser({ email: newUserEmail, name: newUserName, password: newUserPassword })
    setNewUserName("")
    setNewUserEmail("")
    setNewUserPassword("")

    setShowCreateForm(false)
  }

  const handleBan = () => {
    if (!selectedUser || !banReason) return
    banUser(selectedUser.id, banReason)
    setShowBanModal(false)
    setSelectedUser(null)
    setBanReason("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            {record.image ? (
              <img
                alt={record.name}
                className="w-10 h-10 rounded-full"
                src={record.image}
              />
            ) : (
              <UserIcon className="w-5 h-5 text-accent" />
            )}
          </div>
          <div>
            <div className="font-medium text-primary-text">{record.name}</div>
            <div className="text-sm text-muted-text">{record.email}</div>
          </div>
        </div>
      ),
      title: "User",
      width: "30%",
    },
    {
      key: "role",
      render: (_, record) => (
        <Badge
          size="sm"
          variant={record.role === "admin" ? "success" : "secondary"}
        >
          {record.role === "admin" ? (
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Admin
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              User
            </div>
          )}
        </Badge>
      ),
      title: "Role",
      width: "15%",
    },
    {
      key: "emailVerified",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.emailVerified ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <X className="w-4 h-4 text-muted-text" />
          )}
          <span className="text-sm text-muted-text">
            {record.emailVerified ? "Verified" : "Pending"}
          </span>
        </div>
      ),
      title: "Verified",
      width: "12%",
    },
    {
      key: "banned",
      render: (_, record) => (
        <div>
          {record.banned ? (
            <Badge
              size="sm"
              variant="secondary"
            >
              <div className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Banned
              </div>
            </Badge>
          ) : (
            <Badge
              size="sm"
              variant="success"
            >
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active
              </div>
            </Badge>
          )}
          {record.banned && record.banReason && (
            <div className="text-xs text-muted-text mt-1">{record.banReason}</div>
          )}
        </div>
      ),
      title: "Status",
      width: "18%",
    },
    {
      key: "createdAt",
      render: (_, record) => (
        <span className="text-sm text-muted-text">{formatDate(record.createdAt)}</span>
      ),
      title: "Joined",
      width: "15%",
    },
    {
      align: "center",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center gap-2 justify-center">
          <Button
            className="h-7 px-2"
            noFocusRing
            onClick={() => updateUserRole(record.id, record.role === "admin" ? "user" : "admin")}
            size="xs"
            variant="ghost"
          >
            {record.role === "admin" ? (
              <Shield className="w-3.5 h-3.5" />
            ) : (
              <Crown className="w-3.5 h-3.5" />
            )}
          </Button>

          {record.banned ? (
            <Button
              className="h-7 px-2 text-success hover:text-success"
              noFocusRing
              onClick={() => unbanUser(record.id)}
              size="xs"
              variant="ghost"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              className="h-7 px-2 text-destructive hover:text-destructive"
              noFocusRing
              onClick={() => {
                setSelectedUser(record)
                setShowBanModal(true)
              }}
              size="xs"
              variant="ghost"
            >
              <Ban className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            className="h-7 px-2 text-destructive hover:text-destructive"
            noFocusRing
            onClick={() => deleteUser(record.id)}
            size="xs"
            variant="ghost"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
      title: "Actions",
      width: "10%",
    },
  ]

  return (
    <>
      <Card
        className="space-y-4"
        variant="elevated"
      >
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield
                className="text-accent"
                size={24}
              />
              <h2 className="text-2xl font-semibold text-primary-text">Users</h2>
              <Badge
                size="sm"
                variant="secondary"
              >
                {users.length}
              </Badge>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="md"
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>

          {showCreateForm && (
            <Card
              className="mb-4 p-4 bg-muted/5"
              variant="outlined"
            >
              <h3 className="font-semibold text-primary-text mb-3">Create New User</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Name</label>
                  <Input
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="John Doe"
                    value={newUserName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Email</label>
                  <Input
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    type="email"
                    value={newUserEmail}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">
                    Password
                  </label>
                  <Input
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={newUserPassword}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleCreate}
                    size="sm"
                    variant="primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewUserName("")
                      setNewUserEmail("")
                      setNewUserPassword("")
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Divider variant="dotted" />

          {users.length === 0 ? (
            <Card
              className="p-8 text-center bg-muted/5"
              variant="outlined"
            >
              <Shield className="w-12 h-12 mx-auto text-muted-text/40 mb-3" />
              <h3 className="text-lg font-semibold text-primary-text mb-2">No Users Found</h3>
              <p className="text-sm text-muted-text mb-4">
                Create a user account to allow access to your DockStat instance.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First User
              </Button>
            </Card>
          ) : (
            <div className="mt-4">
              <div className="mb-3">
                <p className="text-sm text-muted-text">
                  Manage user accounts, roles, and permissions. Admin users have full access to all
                  features.
                </p>
              </div>
              <Table
                bordered
                columns={columns}
                data={users}
                hoverable
                rowKey="id"
                searchable
                searchPlaceholder="Search users..."
                size="md"
                striped
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Ban User Modal */}
      <Modal
        footer={
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              onClick={handleBan}
              size="md"
              variant="primary"
            >
              <Ban className="w-4 h-4 mr-2" />
              Ban User
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setShowBanModal(false)
                setSelectedUser(null)
                setBanReason("")
              }}
              size="md"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        }
        onClose={() => {
          setShowBanModal(false)
          setSelectedUser(null)
          setBanReason("")
        }}
        open={showBanModal}
        size="md"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Ban className="w-6 h-6 text-destructive" />
            </div>
            <span className="text-xl font-semibold text-primary-text">Ban User</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-muted-text">
            Are you sure you want to ban{" "}
            <span className="font-semibold text-primary-text">{selectedUser?.name}</span>? This user
            will be unable to access the system.
          </p>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1">
              Reason for ban
            </label>
            <Input
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g., Violation of terms of service"
              value={banReason}
            />
          </div>
          <Card
            className="bg-destructive/5"
            variant="outlined"
          >
            <div className="flex items-start gap-3 p-3">
              <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
              <div className="text-sm text-muted-text">
                <p className="font-medium text-primary-text mb-1">Warning</p>
                <p>
                  The user will be immediately logged out and prevented from accessing the system.
                  This action can be reversed by an admin.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    </>
  )
}
