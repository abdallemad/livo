"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { API_ROUTES } from "@/constants/api-routes"
import { viewerKeys } from "@/constants/query-keys"
import type { SyncUserValues } from "@/schemas/user.schema"
import type { ViewerDto } from "@/types/user"

/**
 * The signed-in viewer's DB profile (role lives in Postgres, not Clerk).
 * Runs only once Clerk reports a session, so static pages stay static.
 */
export function useViewer() {
  const { isLoaded, isSignedIn } = useAuth()
  return useQuery({
    queryKey: viewerKeys.me(),
    queryFn: () => api.get<ViewerDto | null>(API_ROUTES.me),
    enabled: isLoaded && !!isSignedIn,
    staleTime: 5 * 60_000,
  })
}

/** Decides which links to show only — `/admin` is still gated server-side. */
export function useIsAdmin() {
  return useViewer().data?.role === "ADMIN"
}

/** Creates the DB user on first sign-in (`/auth-callback`). */
export function useSyncUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SyncUserValues) => api.post<ViewerDto>(API_ROUTES.authSync, values),
    onSuccess: (viewer) => queryClient.setQueryData(viewerKeys.me(), viewer),
  })
}
