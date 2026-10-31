"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSyncUser } from "@/hooks/use-viewer"
import { homeFor } from "@/utils/onboarding-state"

/**
 * After sign-in/up: create the DB user once, then send unfinished users into
 * the onboarding wizard and finished ones to their dashboard (homeFor).
 */
export function AuthCallback() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { mutate, isError, error } = useSyncUser()
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace("/sign-in")
      return
    }
    if (started.current) return
    started.current = true
    mutate({}, { onSuccess: (viewer) => router.replace(homeFor(viewer)) })
  }, [isLoaded, isSignedIn, mutate, router])

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button
          variant="outline"
          onClick={() => mutate({}, { onSuccess: (viewer) => router.replace(homeFor(viewer)) })}
        >
          Try again
        </Button>
      </div>
    )
  }

  return <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
}
