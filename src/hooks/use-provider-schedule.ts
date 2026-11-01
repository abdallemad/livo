"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { providerKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { ProviderReviewListQuery, ScheduleValues } from "@/schemas/provider-schedule.schema"
import type { ProviderReviewList, ProviderSchedule } from "@/types/provider-schedule"

/** `/provider/schedule` (PR-10) and `/provider/reviews` (PR-13) — docs/provider-schedule-reviews-feature.md. */

export function useProviderSchedule(initialData: ProviderSchedule) {
  return useQuery({ queryKey: providerKeys.schedule(), queryFn: () => api.get<ProviderSchedule>(API_ROUTES.provider.schedule), initialData })
}

export function useSaveSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ScheduleValues) => api.put<{ weeklyMinutes: number }>(API_ROUTES.provider.schedule, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerKeys.schedule() }),
  })
}

export function useProviderReviews(query: ProviderReviewListQuery) {
  return useQuery({
    queryKey: providerKeys.reviewList(query),
    queryFn: () => api.get<ProviderReviewList>(API_ROUTES.provider.reviews, query),
    placeholderData: keepPreviousData,
  })
}

export function useReplyToReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string | null }) =>
      reply === null ? api.delete<{ id: string }>(API_ROUTES.provider.reviewReply(id)) : api.put<{ id: string }>(API_ROUTES.provider.reviewReply(id), { reply }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerKeys.reviews() }),
  })
}
