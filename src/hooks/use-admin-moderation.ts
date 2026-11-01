"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { adminKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { DisputeListQuery, ResolveDisputeFormValues, ReviewListQuery, ReviewModerationValues } from "@/schemas/admin.schema"
import type { AdminDisputeDetail, AdminDisputeList, AdminReviewList, DisputeStatusDto } from "@/types/admin"

/**
 * `/admin/disputes` (AD-05) and `/admin/reviews` (AD-08). Every write
 * invalidates all admin queries: a resolution changes booking, payment and
 * dashboard numbers; hiding a review changes the provider's rating.
 */
function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all })
}

export function useAdminDisputes(query: DisputeListQuery) {
  return useQuery({
    queryKey: adminKeys.disputeList(query),
    queryFn: () => api.get<AdminDisputeList>(API_ROUTES.admin.disputes, query),
    placeholderData: keepPreviousData,
  })
}

export function useAdminDispute(id: string, initialData: AdminDisputeDetail) {
  return useQuery({
    queryKey: adminKeys.dispute(id),
    queryFn: () => api.get<AdminDisputeDetail>(API_ROUTES.admin.dispute(id)),
    initialData,
  })
}

/** OPEN → UNDER_REVIEW (also used by the dashboard's "Start review"). */
export function useStartDisputeReview() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (id: string) => api.patch<DisputeStatusDto>(API_ROUTES.admin.disputeStatus(id), { status: "UNDER_REVIEW" }),
    onSuccess: invalidate,
  })
}

export function useResolveDispute(id: string) {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: (values: ResolveDisputeFormValues) =>
      api.patch<DisputeStatusDto>(API_ROUTES.admin.disputeStatus(id), { status: "RESOLVED", ...values }),
    onSuccess: invalidate,
  })
}

export function useAdminReviews(query: ReviewListQuery) {
  return useQuery({
    queryKey: adminKeys.reviewList(query),
    queryFn: () => api.get<AdminReviewList>(API_ROUTES.admin.reviews, query),
    placeholderData: keepPreviousData,
  })
}

export function useModerateReview() {
  const invalidate = useInvalidateAdmin()
  return useMutation({
    mutationFn: ({ id, ...values }: ReviewModerationValues & { id: string }) =>
      api.patch<{ id: string; isHidden: boolean }>(API_ROUTES.admin.reviewStatus(id), values),
    onSuccess: invalidate,
  })
}
