"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { onboardingKeys, viewerKeys } from "@/constants/query-keys"
import { api, apiUpload } from "@/lib/api-client"
import type {
  AddressStepValues,
  BasicInfoStepValues,
  DocumentType,
  FirstServiceStepValues,
  InterestsStepValues,
  ProviderProfileStepValues,
  RoleStepValues,
  SubmitStepValues,
} from "@/schemas/onboarding.schema"
import type { OnboardingDocumentDto, OnboardingFileDto, OnboardingFinishDto, OnboardingStateDto } from "@/types/onboarding"

/**
 * TanStack Query layer for the onboarding wizard. Every step save returns the
 * fresh, server-derived state, which replaces the cache — so the wizard
 * always resumes from what the DB says, never from client memory.
 * Failures surface as `ApiError` (with `fieldErrors` for react-hook-form).
 */

export function useOnboardingState() {
  return useQuery({
    queryKey: onboardingKeys.state(),
    queryFn: () => api.get<OnboardingStateDto>(API_ROUTES.onboarding.state),
    staleTime: 0,
  })
}

/** A step save: PUT/POST JSON, then put the returned state in the cache. */
function useStepMutation<TValues>(send: (values: TValues) => Promise<OnboardingStateDto>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSuccess: (state) => queryClient.setQueryData(onboardingKeys.state(), state),
  })
}

export const useSaveRole = () =>
  useStepMutation((v: RoleStepValues) => api.put<OnboardingStateDto>(API_ROUTES.onboarding.role, v))

export const useSaveBasicInfo = () =>
  useStepMutation((v: BasicInfoStepValues) => api.put<OnboardingStateDto>(API_ROUTES.onboarding.basicInfo, v))

export const useSaveAddress = () =>
  useStepMutation((v: AddressStepValues) => api.put<OnboardingStateDto>(API_ROUTES.onboarding.address, v))

export const useSaveProviderProfile = () =>
  useStepMutation((v: ProviderProfileStepValues) =>
    api.put<OnboardingStateDto>(API_ROUTES.onboarding.providerProfile, v)
  )

export const useSaveFirstService = () =>
  useStepMutation((v: FirstServiceStepValues) => api.put<OnboardingStateDto>(API_ROUTES.onboarding.service, v))

/** Finishing changes what /api/me says (onboardingCompleted), so the viewer cache is refreshed too. */
function useFinishMutation<TValues>(send: (values: TValues) => Promise<OnboardingFinishDto>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
        queryClient.invalidateQueries({ queryKey: viewerKeys.all }),
      ])
    },
  })
}

export const useFinishCustomer = () =>
  useFinishMutation((v: InterestsStepValues) => api.post<OnboardingFinishDto>(API_ROUTES.onboarding.complete, v))

export const useSubmitProvider = () =>
  useFinishMutation((v: SubmitStepValues) => api.post<OnboardingFinishDto>(API_ROUTES.onboarding.submit, v))

export interface UploadVariables {
  file: Blob
  onProgress?: (fraction: number) => void
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, type, onProgress }: UploadVariables & { type: DocumentType }) => {
      const form = new FormData()
      form.set("type", type)
      form.set("file", file, "upload")
      return apiUpload<OnboardingDocumentDto>(API_ROUTES.onboarding.documents, form, onProgress)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.state() }),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(API_ROUTES.onboarding.document(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.state() }),
  })
}

/** Service images don't change the step state, so the caller keeps them in form state. */
export function useUploadServiceImage() {
  return useMutation({
    mutationFn: ({ file, onProgress }: UploadVariables) => {
      const form = new FormData()
      form.set("file", file, "upload")
      return apiUpload<OnboardingFileDto>(API_ROUTES.onboarding.serviceImages, form, onProgress)
    },
  })
}

export function useDeleteServiceImage() {
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(API_ROUTES.onboarding.serviceImage(id)),
  })
}
