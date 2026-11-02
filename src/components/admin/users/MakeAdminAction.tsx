"use client"

import { useAuth } from "@clerk/nextjs"
import type { Role, UserStatus } from "@prisma/client"
import { ShieldPlus } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { usePromoteToAdmin } from "@/hooks/use-admin-users"

interface MakeAdminActionProps {
  id: string
  name: string
  role: Role
  status: UserStatus
  size?: "sm" | "default"
}

/**
 * Promote one account to admin (docs/admin-providers-users-feature.md). Upgrade only, and only for ACTIVE
 * customers and providers — hidden for admins, your own account, suspended and deleted accounts (the service
 * refuses those too). Confirmed first: an admin can see and change everything on the platform.
 */
export function MakeAdminAction({ id, name, role, status, size = "sm" }: MakeAdminActionProps) {
  const { userId } = useAuth()
  const promote = usePromoteToAdmin()

  if (role === "ADMIN" || id === userId || status !== "ACTIVE") return null

  return (
    <ConfirmDialog
      trigger={
        <Button size={size} variant="outline" disabled={promote.isPending}>
          {promote.isPending ? <Spinner data-icon="inline-start" /> : <ShieldPlus data-icon="inline-start" aria-hidden />}
          Make admin
        </Button>
      }
      title={`Make ${name} an admin?`}
      description={`They get full access to the admin dashboard: every user, provider, booking, payment and setting. ${
        role === "PROVIDER" ? "Their provider profile and services stay as they are. " : ""
      }There's no button to undo this — removing an admin is done by hand in the database.`}
      confirmLabel="Make admin"
      cancelLabel="Cancel"
      onConfirm={() =>
        promote.mutate(
          { id, role: "ADMIN" },
          { onSuccess: () => toast.success(`${name} is now an admin`), onError: (e) => toast.error(e.message) },
        )
      }
    />
  )
}
