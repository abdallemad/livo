"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { providerKeys } from "@/constants/query-keys"
import { api, apiUpload } from "@/lib/api-client"
import type { PortfolioItemValues, ServiceFormValues } from "@/schemas/provider-catalog.schema"
import type { ProviderPortfolio, ProviderServiceList, UploadedFileDto } from "@/types/provider-catalog"

/**
 * `/provider/services*` (PR-05) and `/provider/portfolio` (PR-04) —
 * docs/provider-services-portfolio-feature.md. Lists get `initialData` from the server; every write
 * invalidates `providerKeys.all` (the home page's setup checklist reads services too).
 */
function useInvalidateProvider() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: providerKeys.all })
}

type UploadVariables = { file: Blob; onProgress?: (fraction: number) => void }

function uploadTo(path: string) {
  return ({ file, onProgress }: UploadVariables) => {
    const form = new FormData()
    form.set("file", file, "upload")
    return apiUpload<UploadedFileDto>(path, form, onProgress)
  }
}

// --- services -----------------------------------------------------------------

export function useProviderServices(initialData: ProviderServiceList) {
  return useQuery({
    queryKey: providerKeys.services(),
    queryFn: () => api.get<ProviderServiceList>(API_ROUTES.provider.services),
    initialData,
  })
}

export function useSaveService(id: string | null) {
  const invalidate = useInvalidateProvider()
  return useMutation({
    mutationFn: (values: ServiceFormValues) =>
      id ? api.put<{ id: string }>(API_ROUTES.provider.service(id), values) : api.post<{ id: string }>(API_ROUTES.provider.services, values),
    onSuccess: invalidate,
  })
}

export function useToggleService() {
  const invalidate = useInvalidateProvider()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch<{ id: string }>(API_ROUTES.provider.serviceStatus(id), { isActive }),
    onSuccess: invalidate,
  })
}

export function useDeleteService() {
  const invalidate = useInvalidateProvider()
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.provider.service(id)), onSuccess: invalidate })
}

export function useUploadServiceImage() {
  return useMutation({ mutationFn: uploadTo(API_ROUTES.provider.serviceImages) })
}

export function useDeletePendingServiceImage() {
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.provider.serviceImage(id)) })
}

// --- portfolio ----------------------------------------------------------------

export function useProviderPortfolio(initialData: ProviderPortfolio) {
  return useQuery({
    queryKey: providerKeys.portfolio(),
    queryFn: () => api.get<ProviderPortfolio>(API_ROUTES.provider.portfolio),
    initialData,
  })
}

export function useSavePortfolioItem(id: string | null) {
  const invalidate = useInvalidateProvider()
  return useMutation({
    mutationFn: (values: PortfolioItemValues) =>
      id ? api.put<{ id: string }>(API_ROUTES.provider.portfolioItem(id), values) : api.post<{ id: string }>(API_ROUTES.provider.portfolio, values),
    onSuccess: invalidate,
  })
}

export function useDeletePortfolioItem() {
  const invalidate = useInvalidateProvider()
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.provider.portfolioItem(id)), onSuccess: invalidate })
}

export function useReorderPortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => api.put<void>(API_ROUTES.provider.portfolioOrder, { ids }),
    // Show the new order at once; roll back if the server refuses.
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: providerKeys.portfolio() })
      const previous = queryClient.getQueryData<ProviderPortfolio>(providerKeys.portfolio())
      if (previous) {
        const byId = new Map(previous.items.map((i) => [i.id, i]))
        queryClient.setQueryData<ProviderPortfolio>(providerKeys.portfolio(), { ...previous, items: ids.map((id) => byId.get(id)!).filter(Boolean) })
      }
      return { previous }
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(providerKeys.portfolio(), ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: providerKeys.portfolio() }),
  })
}

export function useUploadPortfolioImage() {
  return useMutation({ mutationFn: uploadTo(API_ROUTES.provider.portfolioImages) })
}

export function useDeletePendingPortfolioImage() {
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.provider.portfolioImage(id)) })
}
