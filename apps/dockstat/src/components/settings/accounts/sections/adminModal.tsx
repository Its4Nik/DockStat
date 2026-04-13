import { Button, Card, Modal } from "@dockstat/ui"
import { AlertCircle, Plus, Shield, X } from "lucide-react"

export type AdminModalChoice = "yes" | "no" | "ask-later"

interface AdminModalProps {
  open: boolean
  onClose: () => void
  onChoice: (choice: AdminModalChoice) => void
}

export function AdminModal({ open, onClose, onChoice }: AdminModalProps) {
  return (
    <Modal
      footer={
        <div className="flex flex-col gap-3 w-full">
          <Button
            className="w-full"
            onClick={() => onChoice("yes")}
            size="md"
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yes, create admin account
          </Button>

          <Button
            className="w-full"
            onClick={() => onChoice("ask-later")}
            size="md"
            variant="ghost"
          >
            Ask me later
          </Button>

          <Button
            className="w-full"
            onClick={() => onChoice("no")}
            size="md"
            variant="ghost"
          >
            <X className="w-4 h-4 mr-2" />
            No, don't show this again
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Shield className="w-6 h-6 text-yellow-500" />
          </div>
          <span className="text-xl font-semibold text-primary-text">No Admin Account Found</span>
        </div>
      }
    >
      <p className="text-muted-text mb-4">
        We couldn't find any admin accounts in the system. Would you like to create an admin account
        to manage users, API keys, and OAuth providers?
      </p>

      <Card
        className="bg-muted/5"
        variant="outlined"
      >
        <div className="flex items-start gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
          <div className="text-sm text-muted-text">
            <p className="font-medium text-primary-text mb-1">Why create an admin account?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Manage user accounts and permissions</li>
              <li>Create and configure API keys</li>
              <li>Set up OAuth providers</li>
              <li>Control system-wide settings</li>
            </ul>
          </div>
        </div>
      </Card>
    </Modal>
  )
}
