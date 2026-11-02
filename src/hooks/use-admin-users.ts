"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { UserListQuery, UserRoleValues, UserStatusValues } from "@/schemas/admin.schema"
import type { AdminUserDetail, AdminUserListItem, UserRoleDto, UserStatusDto } from "@/types/admin"
import type { Paginated } from "@/types/api"

/** `/admin/users` (AD-03): list, detail, suspend / activate, make admin. */
export function useAdminUsers(query: UserListQuery) {
  return useQuery({
    queryKey: adminKeys.userList(query),
    queryFn: () => api.get<Paginated<AdminUserListItem>>(API_ROUTES.admin.users, query),
    placeholderData: keepPreviousData,
  })
}

/** The server page passes the first snapshot as `initialData`. */
export function useAdminUser(id: string, initialData: AdminUserDetail) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => api.get<AdminUserDetail>(API_ROUTES.admin.user(id)),
    initialData,
  })
}

export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: UserStatusValues & { id: string }) =>
      api.patch<UserStatusDto>(API_ROUTES.admin.userStatus(id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/** Promote an account to admin (upgrade only). */
export function usePromoteToAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: UserRoleValues & { id: string }) => api.patch<UserRoleDto>(API_ROUTES.admin.userRole(id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}
