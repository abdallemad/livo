"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { ServiceListQuery, ServiceModerationValues } from "@/schemas/admin.schema"
import type { CreateCategoryValues, UpdateCategoryValues } from "@/schemas/category.schema"
import type { AdminCategoryListItem, AdminServiceListItem, ServiceModerationDto } from "@/types/admin"
import type { Paginated } from "@/types/api"

/**
 * `/admin/categories` and `/admin/services` (AD-02). Every write invalidates
 * all admin queries (category counts, service visibility and the dashboard
 * depend on each other).
 */
function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all })
}

/** `initialData` comes from the server page on `/admin/categories`; the services filter loads it lazily. */
export function useAdminCategories(initialData?: AdminCategoryListItem[]) {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => api.get<AdminCategoryListItem[]>(API_ROUTES.admin.categories),
    initialData,
  })
}

export function useCreateCategory() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (values: CreateCategoryValues) => api.post<{ id: string }>(API_ROUTES.admin.categories, values),
    onSuccess: invalidate,
  })
}

export function useUpdateCategory(id: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (values: UpdateCategoryValues) => api.patch<{ id: string }>(API_ROUTES.admin.category(id), values),
    onSuccess: invalidate,
  })
}

export function useSetCategoryActive() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<{ id: string; isActive: boolean }>(API_ROUTES.admin.categoryStatus(id), { isActive }),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(API_ROUTES.admin.category(id)),
    onSuccess: invalidate,
  })
}

export function useAdminServices(query: ServiceListQuery) {
  return useQuery({
    queryKey: adminKeys.serviceList(query),
    queryFn: () => api.get<Paginated<AdminServiceListItem>>(API_ROUTES.admin.services, query),
    placeholderData: keepPreviousData,
  })
}

export function useModerateService() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ id, ...values }: ServiceModerationValues & { id: string }) =>
      api.patch<ServiceModerationDto>(API_ROUTES.admin.serviceStatus(id), values),
    onSuccess: invalidate,
  })
}
