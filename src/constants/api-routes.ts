/**
 * Every API endpoint path in one place, so hooks never hand-build URLs and a
 * renamed route is a one-line change. Mirrors the folders in `src/app/api`.
 */
export const API_ROUTES = {
  health: "/api/health",
  me: "/api/me",
  authSync: "/api/auth/sync",
} as const
