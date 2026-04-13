import { eden } from "@dockstat/utils/react"
import { useEffect, useMemo, useState } from "react"
import { useAccountMutations } from "@/hooks/mutations"
import { api } from "@/lib/api"

export type ApiKey = {
  id: string
  name: string | null
  key: string
  referenceId: string
  enabled: boolean
  expiresAt: string | null
  createdAt: string
  lastRequest: string | null
}

export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: "admin" | "user"
  banned: boolean
  banReason: string | null
  banExpires: string | null
  createdAt: string
}

export type OAuthProvider = {
  id: string
  providerId: string
  name: string
  type: "oauth" | "oidc"
  enabled: boolean
  clientId: string
  scopes: string[]
  issuer?: string
}

type AdminModalOption = "yes" | "no" | "ask-later"

export function useAccounts() {
  const {
    createApiKeyMutation,
    deleteApiKeyMutation,
    updateApiKeyMutation,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    banUserMutation,
    unbanUserMutation,
    updateRoleMutation,
    addOAuthProviderMutation,
    removeOAuthProviderMutation,
  } = useAccountMutations()

  // Fetch API Keys
  const { data: apiKeys, isLoading: isLoadingApiKeys } = eden.useEdenQuery({
    queryKey: ["fetchApiKeys"],
    route: api.auth["api-key"].list.get,
  })

  // Fetch Users
  const { data: users, isLoading: isLoadingUsers } = eden.useEdenQuery({
    queryKey: ["fetchUsers"],
    route: api.auth.admin.users.get,
  })

  // Fetch OAuth Providers
  const { data: oauthProviders, isLoading: isLoadingOAuthProviders } = eden.useEdenQuery({
    queryKey: ["fetchOAuthProviders"],
    route: api.auth.oauth.providers.get,
  })

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminModalChoice, setAdminModalChoice] = useState<AdminModalOption | null>(null)

  // Check if we should show the admin modal
  const hasAdminUser = useMemo(() => {
    if (!users || !Array.isArray(users)) return false
    return users.some((user) => user.role === "admin" && !user.banned)
  }, [users])

  const hasAnyUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return false
    return users.length > 0
  }, [users])

  // Load admin modal preference from localStorage
  useEffect(() => {
    const savedChoice = localStorage.getItem("dockstat-admin-modal-choice")
    if (savedChoice) {
      setAdminModalChoice(savedChoice as AdminModalOption)
    }
  }, [])

  // Show modal if no users exist and user hasn't said "no"
  useEffect(() => {
    if (!hasAnyUsers && adminModalChoice !== "no") {
      if (adminModalChoice === "ask-later" || adminModalChoice === null) {
        setShowAdminModal(true)
      }
    }
  }, [hasAnyUsers, adminModalChoice])

  // API Key Actions
  const createApiKey = async (data: { name: string; referenceId: string }) => {
    await createApiKeyMutation.mutateAsync(data)
  }

  const deleteApiKey = async (id: string) => {
    await deleteApiKeyMutation.mutateAsync({ id })
  }

  const toggleApiKey = async (id: string, enabled: boolean) => {
    await updateApiKeyMutation.mutateAsync({ enabled, id })
  }

  // User Actions
  const createUser = async (data: { email: string; password: string; name: string }) => {
    await createUserMutation.mutateAsync(data)
  }

  const updateUser = async (id: string, data: Partial<User>) => {
    await updateUserMutation.mutateAsync({ id, ...data })
  }

  const deleteUser = async (id: string) => {
    await deleteUserMutation.mutateAsync({ id })
  }

  const banUser = async (id: string, reason: string) => {
    await banUserMutation.mutateAsync({ id, reason })
  }

  const unbanUser = async (id: string) => {
    await unbanUserMutation.mutateAsync({ id })
  }

  const updateUserRole = async (id: string, role: "admin" | "user") => {
    await updateRoleMutation.mutateAsync({ id, role })
  }

  // OAuth Provider Actions
  const addOAuthProvider = async (data: {
    providerId: string
    type: "oauth" | "oidc"
    clientId: string
    clientSecret: string
    scopes: string[]
    issuer?: string
  }) => {
    await addOAuthProviderMutation.mutateAsync(data)
  }

  const removeOAuthProvider = async (providerId: string) => {
    await removeOAuthProviderMutation.mutateAsync({ providerId })
  }

  // Admin Modal Actions
  const handleAdminModalChoice = (choice: AdminModalOption) => {
    setAdminModalChoice(choice)
    localStorage.setItem("dockstat-admin-modal-choice", choice)
    setShowAdminModal(false)
  }

  return {
    // OAuth Provider Actions
    addOAuthProvider,
    // Data
    apiKeys: (apiKeys as ApiKey[]) ?? [],
    banUser,

    // API Key Actions
    createApiKey,

    // User Actions
    createUser,
    deleteApiKey,
    deleteUser,
    handleAdminModalChoice,
    hasAdminUser,
    hasAnyUsers,
    isLoading: isLoadingApiKeys || isLoadingUsers || isLoadingOAuthProviders,
    oauthProviders: (oauthProviders as OAuthProvider[]) ?? [],
    removeOAuthProvider,

    // Admin Modal
    showAdminModal,
    toggleApiKey,
    unbanUser,
    updateUser,
    updateUserRole,
    users: (users as User[]) ?? [],
  }
}
