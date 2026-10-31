"use client"

import { useAuth } from "@clerk/nextjs"
import type { Role, UserStatus } from "@prisma/client"
import { Ban, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSetUserStatus } from "@/hooks/use-admin-users"

interface UserStatusActionsProps {
  id: string
  name: string
  role: Role
  status: UserStatus
  size?: "sm" | "default"
}

/**
 * Suspend (with a reason) / re-activate one account (AD-03). Hidden for admins,
 * for your own account and for deleted accounts — the service refuses those too.
 */
export function UserStatusActions({ id, name, role, status, size = "sm" }: UserStatusActionsProps) {
  const { userId } = useAuth()
  const setStatus = useSetUserStatus()
  const busy = setStatus.isPending

  if (role === "ADMIN" || id === userId || status === "DELETED") return null

  if (status === "ACTIVE") {
    return (
      <ReasonDialog
        trigger={
          <Button size={size} variant="destructive" disabled={busy}>
            <Ban data-icon="inline-start" aria-hidden />
            Suspend
          </Button>
        }
        title={`Suspend ${name}'s account?`}
        description={
          role === "PROVIDER"
            ? "They're locked out of their dashboard and every action, and their provider profile is hidden from the site until re-activated."
            : "They're locked out of their dashboard and every action until re-activated. Public pages stay open to them."
        }
        confirmLabel="Suspend account"
        pending={busy}
        onSubmit={(reason) =>
          setStatus.mutateAsync({ id, status: "SUSPENDED", reason }).then(() => toast.success(`${name}'s account is suspended`))
        }
      />
    )
  }

  return (
    <ConfirmDialog
      trigger={
        <Button size={size} variant="outline" disabled={busy}>
          {busy ? <Spinner data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" aria-hidden />}
          Activate
        </Button>
      }
      title={`Re-activate ${name}'s account?`}
      description="They can sign in to their dashboard and use the app again."
      confirmLabel="Activate account"
      cancelLabel="Cancel"
      destructive={false}
      onConfirm={() =>
        setStatus.mutate(
          { id, status: "ACTIVE" },
          { onSuccess: () => toast.success(`${name}'s account is active again`), onError: (e) => toast.error(e.message) },
        )
      }
    />
  )
}
