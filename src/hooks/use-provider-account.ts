"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { providerKeys } from "@/constants/query-keys"
import { api, apiUpload } from "@/lib/api-client"
import type { DocumentType } from "@/schemas/onboarding.schema"
import type { PersonalSettingsValues, WorkSettingsValues } from "@/schemas/provider-account.schema"
import type { ProviderSettings, ProviderVerification, VerificationDocumentDto } from "@/types/provider-account"

/**
 * `/provider/verification` (PR-02, PR-03) and `/provider/settings` (AU-06) —
 * docs/provider-verification-settings-feature.md. Writes invalidate every provider query
 * (the home page shows the status; requests depend on specialties and areas).
 */
function useInvalidateProvider() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: providerKeys.all })
}

export function useProviderVerification(initialData: ProviderVerification) {
  return useQuery({ queryKey: providerKeys.verification(), queryFn: () => api.get<ProviderVerification>(API_ROUTES.provider.verification), initialData })
}

export function useUploadVerificationDocument(type: DocumentType) {
  const invalidate = useInvalidateProvider()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: Blob; onProgress?: (fraction: number) => void }) => {
      const form = new FormData()
      form.set("type", type)
      form.set("file", file, "upload")
      return apiUpload<VerificationDocumentDto>(API_ROUTES.provider.verificationDocuments, form, onProgress)
    },
    onSuccess: invalidate,
  })
}

export function useDeleteVerificationDocument() {
  const invalidate = useInvalidateProvider()
  return useMutation({ mutationFn: (id: string) => api.delete<void>(API_ROUTES.provider.verificationDocument(id)), onSuccess: invalidate })
}

export function useResubmitVerification() {
  const invalidate = useInvalidateProvider()
  return useMutation({ mutationFn: () => api.post<{ status: string }>(API_ROUTES.provider.verificationResubmit), onSuccess: invalidate })
}

export function useProviderSettings(initialData: ProviderSettings) {
  return useQuery({ queryKey: providerKeys.settings(), queryFn: () => api.get<ProviderSettings>(API_ROUTES.provider.settings), initialData })
}

export function useSavePersonalSettings() {
  const invalidate = useInvalidateProvider()
  return useMutation({ mutationFn: (values: PersonalSettingsValues) => api.put<{ name: string }>(API_ROUTES.provider.settingsPersonal, values), onSuccess: invalidate })
}

export function useSaveWorkSettings() {
  const invalidate = useInvalidateProvider()
  return useMutation({ mutationFn: (values: WorkSettingsValues) => api.put<{ ok: true }>(API_ROUTES.provider.settingsWork, values), onSuccess: invalidate })
}
