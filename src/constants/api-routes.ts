/**
 * Every API endpoint path in one place, so hooks never hand-build URLs and a
 * renamed route is a one-line change. Mirrors the folders in `src/app/api`.
 */
export const API_ROUTES = {
  health: "/api/health",
  me: "/api/me",
  authSync: "/api/auth/sync",
  onboarding: {
    state: "/api/onboarding",
    role: "/api/onboarding/role",
    basicInfo: "/api/onboarding/basic-info",
    address: "/api/onboarding/address",
    complete: "/api/onboarding/complete",
    providerProfile: "/api/onboarding/provider-profile",
    documents: "/api/onboarding/documents",
    document: (id: string) => `/api/onboarding/documents/${encodeURIComponent(id)}`,
    service: "/api/onboarding/service",
    serviceImages: "/api/onboarding/service/images",
    serviceImage: (id: string) => `/api/onboarding/service/images/${encodeURIComponent(id)}`,
    submit: "/api/onboarding/submit",
    file: (id: string) => `/api/onboarding/files/${encodeURIComponent(id)}`,
  },
  admin: {
    dashboard: "/api/admin/dashboard",
    providers: "/api/admin/providers",
    provider: (id: string) => `/api/admin/providers/${encodeURIComponent(id)}`,
    providerStatus: (id: string) => `/api/admin/providers/${encodeURIComponent(id)}/status`,
    disputeStatus: (id: string) => `/api/admin/disputes/${encodeURIComponent(id)}/status`,
    users: "/api/admin/users",
    user: (id: string) => `/api/admin/users/${encodeURIComponent(id)}`,
    userStatus: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/status`,
    /** Admin-only preview of a provider verification document (307 to a signed link). */
    file: (id: string) => `/api/admin/files/${encodeURIComponent(id)}`,
  },
} as const
