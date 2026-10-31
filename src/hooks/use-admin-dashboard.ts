"use client"

import { useQuery } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { AdminDashboardDto } from "@/types/admin"

/**
 * `/admin` dashboard data. The page renders it on the server and hands it in
 * as `initialData` (no first-visit API call); every action invalidates it so
 * the KPIs and queues refetch from `GET /api/admin/dashboard`. The actions
 * live in `use-admin-providers.ts` and `use-admin-moderation.ts`.
 */
export function useAdminDashboard(initialData: AdminDashboardDto) {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => api.get<AdminDashboardDto>(API_ROUTES.admin.dashboard),
    initialData,
  })
}
