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
} as const
