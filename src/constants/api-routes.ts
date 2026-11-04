/**
 * Every API endpoint path in one place, so hooks never hand-build URLs and a
 * renamed route is a one-line change. Mirrors the folders in `src/app/api`.
 */
export const API_ROUTES = {
  health: "/api/health",
  me: "/api/me",
  /** Public catalog (MK-02): filtered LIVE services. */
  services: "/api/services",
  /** Livo AI Assistant (Gemini): POST one chat turn — docs/ai-assistant-feature.md. */
  assistantChat: "/api/assistant/chat",
  /** Dashboard assistants (grounded in the signed-in user's own work). */
  customerAssistant: "/api/me/assistant",
  providerAssistant: "/api/provider/assistant",
  customer: {
    dashboard: "/api/me/dashboard",
    requests: "/api/me/requests",
    /** One request with its quotes (GET); accept a quote → booking (POST …/booking) — docs/customer-request-detail-feature.md. */
    request: (id: string) => `/api/me/requests/${encodeURIComponent(id)}`,
    requestBooking: (id: string) => `/api/me/requests/${encodeURIComponent(id)}/booking`,
    requestStatus: (id: string) => `/api/me/requests/${encodeURIComponent(id)}/status`,
    /** Photos for a new quote request (CU-03): POST to upload, DELETE an unsent one. */
    requestImages: "/api/me/requests/images",
    requestImage: (id: string) => `/api/me/requests/images/${encodeURIComponent(id)}`,
    /** Owner-only preview of the customer's own upload (307 to a signed link). */
    file: (id: string) => `/api/me/files/${encodeURIComponent(id)}`,
    settings: "/api/me/settings",
    settingsPersonal: "/api/me/settings/personal",
    settingsInterests: "/api/me/settings/interests",
    addresses: "/api/me/addresses",
    address: (id: string) => `/api/me/addresses/${encodeURIComponent(id)}`,
    addressDefault: (id: string) => `/api/me/addresses/${encodeURIComponent(id)}/default`,
    /** GET my bookings; POST books a fixed-price service (CU-02, docs/booking-checkout-feature.md). */
    bookings: "/api/me/bookings",
    /** One booking (GET) and the customer's confirm / cancel (PATCH …/status) — docs/customer-booking-detail-feature.md. */
    booking: (id: string) => `/api/me/bookings/${encodeURIComponent(id)}`,
    bookingStatus: (id: string) => `/api/me/bookings/${encodeURIComponent(id)}/status`,
    /** Stripe Checkout link for an unpaid booking (Pay now / retry). */
    bookingCheckout: (id: string) => `/api/me/bookings/${encodeURIComponent(id)}/checkout`,
    /** The booking wizard's confirmation step, polled while the payment settles. */
    bookingConfirmation: (id: string) => `/api/me/bookings/${encodeURIComponent(id)}/confirmation`,
    payments: "/api/me/payments",
    /** Booking chat (CU-06) — docs/messages-feature.md. */
    messages: "/api/me/messages",
    thread: (bookingId: string) => `/api/me/messages/${encodeURIComponent(bookingId)}`,
    threadRead: (bookingId: string) => `/api/me/messages/${encodeURIComponent(bookingId)}/read`,
    unreadMessages: "/api/me/messages/unread",
  },
  authSync: "/api/auth/sync",
  /** The notification centre (bell + `/account/notifications`) — docs/notifications-feature.md. */
  notifications: "/api/me/notifications",
  notificationsRead: "/api/me/notifications/read",
  /** Pusher private-channel signatures (called by pusher-js, not by hooks) — docs/realtime-feature.md. */
  realtimeAuth: "/api/realtime/auth",
  /** Stripe → Livo, signature-authenticated (never called by the browser). */
  stripeWebhook: "/api/webhook/stripe",
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
  provider: {
    dashboard: "/api/provider/dashboard",
    requests: "/api/provider/requests",
    /** One request (GET), my quote on it (PUT …/quote), its photos — docs/provider-request-detail-feature.md. */
    request: (id: string) => `/api/provider/requests/${encodeURIComponent(id)}`,
    requestQuote: (id: string) => `/api/provider/requests/${encodeURIComponent(id)}/quote`,
    requestPhoto: (id: string, fileId: string) => `/api/provider/requests/${encodeURIComponent(id)}/photos/${encodeURIComponent(fileId)}`,
    quotes: "/api/provider/quotes",
    quoteStatus: (id: string) => `/api/provider/quotes/${encodeURIComponent(id)}/status`,
    bookings: "/api/provider/bookings",
    booking: (id: string) => `/api/provider/bookings/${encodeURIComponent(id)}`,
    bookingStatus: (id: string) => `/api/provider/bookings/${encodeURIComponent(id)}/status`,
    services: "/api/provider/services",
    service: (id: string) => `/api/provider/services/${encodeURIComponent(id)}`,
    serviceStatus: (id: string) => `/api/provider/services/${encodeURIComponent(id)}/status`,
    serviceImages: "/api/provider/services/images",
    serviceImage: (id: string) => `/api/provider/services/images/${encodeURIComponent(id)}`,
    portfolio: "/api/provider/portfolio",
    portfolioItem: (id: string) => `/api/provider/portfolio/${encodeURIComponent(id)}`,
    portfolioOrder: "/api/provider/portfolio/order",
    portfolioImages: "/api/provider/portfolio/images",
    portfolioImage: (id: string) => `/api/provider/portfolio/images/${encodeURIComponent(id)}`,
    schedule: "/api/provider/schedule",
    earnings: "/api/provider/earnings",
    verification: "/api/provider/verification",
    verificationDocuments: "/api/provider/verification/documents",
    verificationDocument: (id: string) => `/api/provider/verification/documents/${encodeURIComponent(id)}`,
    verificationResubmit: "/api/provider/verification/resubmit",
    settings: "/api/provider/settings",
    settingsPersonal: "/api/provider/settings/personal",
    settingsWork: "/api/provider/settings/work",
    payouts: "/api/provider/payouts",
    /** Booking chat (PR-09) — docs/messages-feature.md. */
    messages: "/api/provider/messages",
    thread: (bookingId: string) => `/api/provider/messages/${encodeURIComponent(bookingId)}`,
    threadRead: (bookingId: string) => `/api/provider/messages/${encodeURIComponent(bookingId)}/read`,
    unreadMessages: "/api/provider/messages/unread",
    reviews: "/api/provider/reviews",
    reviewReply: (id: string) => `/api/provider/reviews/${encodeURIComponent(id)}/reply`,
    /** Owner-only preview of a service / portfolio photo (307 to a 5-minute signed link). */
    file: (id: string) => `/api/provider/files/${encodeURIComponent(id)}`,
  },
  admin: {
    dashboard: "/api/admin/dashboard",
    providers: "/api/admin/providers",
    provider: (id: string) => `/api/admin/providers/${encodeURIComponent(id)}`,
    providerStatus: (id: string) => `/api/admin/providers/${encodeURIComponent(id)}/status`,
    disputes: "/api/admin/disputes",
    dispute: (id: string) => `/api/admin/disputes/${encodeURIComponent(id)}`,
    disputeStatus: (id: string) => `/api/admin/disputes/${encodeURIComponent(id)}/status`,
    reviews: "/api/admin/reviews",
    reviewStatus: (id: string) => `/api/admin/reviews/${encodeURIComponent(id)}/status`,
    users: "/api/admin/users",
    user: (id: string) => `/api/admin/users/${encodeURIComponent(id)}`,
    userStatus: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/status`,
    /** Promote an account to admin (upgrade only). */
    userRole: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/role`,
    categories: "/api/admin/categories",
    category: (id: string) => `/api/admin/categories/${encodeURIComponent(id)}`,
    categoryStatus: (id: string) => `/api/admin/categories/${encodeURIComponent(id)}/status`,
    services: "/api/admin/services",
    serviceStatus: (id: string) => `/api/admin/services/${encodeURIComponent(id)}/status`,
    requests: "/api/admin/requests",
    request: (id: string) => `/api/admin/requests/${encodeURIComponent(id)}`,
    requestStatus: (id: string) => `/api/admin/requests/${encodeURIComponent(id)}/status`,
    bookings: "/api/admin/bookings",
    booking: (id: string) => `/api/admin/bookings/${encodeURIComponent(id)}`,
    bookingStatus: (id: string) => `/api/admin/bookings/${encodeURIComponent(id)}/status`,
    payments: "/api/admin/payments",
    payouts: "/api/admin/payouts",
    payoutStatus: (id: string) => `/api/admin/payouts/${encodeURIComponent(id)}/status`,
    commission: "/api/admin/commission",
    commissionCategory: (categoryId: string) => `/api/admin/commission/categories/${encodeURIComponent(categoryId)}`,
    /** Admin-only preview of a provider verification document (307 to a signed link). */
    file: (id: string) => `/api/admin/files/${encodeURIComponent(id)}`,
  },
} as const
