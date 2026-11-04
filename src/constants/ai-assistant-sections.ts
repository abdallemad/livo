/**
 * Dashboard sections the assistant adapts to (docs/ai-assistant-feature.md). The panel sends the current pathname; the
 * server resolves it HERE (longest matching prefix, else the zone's home) — the path is never put in the prompt as-is.
 * `requirements` are the SRS ids the page implements (docs/srs.md); `focus` steers the model on that page; `starters`
 * are the first tappable questions. Shared by server and browser: plain data, no secrets.
 */
export type DashboardAssistantMode = "customer" | "provider" | "admin"

export interface AssistantSection {
  key: string
  /** Path prefix in the dashboard (`/provider/quotes`); `exact` for a zone home. */
  prefix: string
  exact?: boolean
  label: string
  requirements: string
  focus: string
  starters: readonly string[]
}

export const ASSISTANT_SECTIONS: Record<DashboardAssistantMode, readonly AssistantSection[]> = {
  customer: [
    {
      key: "home",
      prefix: "/account",
      exact: true,
      label: "Home",
      requirements: "CU-08",
      focus: "Overview. Start from the 'needs attention' items in the dashboard data: what to do first and why (confirm finished work, pay, compare quotes, review).",
      starters: ["What needs my attention?", "عندي تسريب مياه في الحمام", "Help me write a quote request"],
    },
    {
      key: "new_request",
      prefix: "/account/requests/new",
      label: "New quote request",
      requirements: "CU-03",
      focus:
        "They are filling in a quote request (description, photos, category, address, optional budget, preferred date). Ask what the job is, then write a clear title and description in draft: what, where in the home, sizes/quantities, current state, materials wanted, timing, access. Suggest which photos to add and a realistic budget range.",
      starters: ["Help me describe my job", "What photos should I add?", "What budget is realistic?"],
    },
    {
      key: "requests",
      prefix: "/account/requests",
      label: "My requests",
      requirements: "CU-03, CU-04, CU-05, CU-08, CU-11",
      focus:
        "Their quote requests and the quotes received. Help compare quotes on price, duration, what's included, materials, provider rating and reviews — not price alone. Explain that accepting a quote creates a booking (CU-05), that an open request with no quotes expires after a while (BR-05), and that any price change after an inspection needs both sides' explicit agreement (BR-07).",
      starters: ["How do I compare my quotes?", "What should I ask a provider before accepting?", "Why haven't I received quotes yet?"],
    },
    {
      key: "book",
      prefix: "/account/book",
      label: "Booking a service",
      requirements: "CU-02, CU-07",
      focus: "They are booking a fixed-price service: picking a time, address and notes, then paying online or cash where offered. Help them write useful notes for the provider (in draft) and explain the payment options.",
      starters: ["What should I write in the notes?", "Online payment or cash?", "How do I prepare for the visit?"],
    },
    {
      key: "bookings",
      prefix: "/account/bookings",
      label: "My bookings",
      requirements: "CU-08, CU-09, CU-10, CU-11, CU-12",
      focus:
        "Their bookings. Explain the timeline and next step: confirm the work only when it's done properly (CU-09); online payment is released to the provider after they confirm or after the objection window shown on the booking ends (BR-08); if something is wrong, open a dispute from the booking before confirming (CU-12); cancellation depends on how close the appointment is — the booking page shows what's possible (BR-06); review only after completion (BR-03, CU-10). Help write a fair review or a clear dispute description in draft.",
      starters: ["The work isn't finished properly — what do I do?", "Help me write a review", "Can I cancel my booking?"],
    },
    {
      key: "messages",
      prefix: "/account/messages",
      label: "Messages",
      requirements: "CU-06, SY-04",
      focus: "Chat with their provider. Help write clear, polite messages in draft (timing, access, details, extra work). Phone numbers stay hidden until the booking is confirmed (BR-02) and numbers typed in chat may be blocked (SY-04).",
      starters: ["Write a message asking about the arrival time", "How do I ask about extra costs politely?"],
    },
    {
      key: "payments",
      prefix: "/account/payments",
      label: "Payments and invoices",
      requirements: "CU-07, CU-13",
      focus: "Their payments and invoices. Explain held payments (released after confirmation, BR-08), what a refund looks like after a dispute, and where to find each invoice. Don't guess amounts not in the data.",
      starters: ["When does the provider get my money?", "How do refunds work?"],
    },
    {
      key: "addresses",
      prefix: "/account/addresses",
      label: "Addresses",
      requirements: "CU-14",
      focus: "Saved addresses. Help them write clear directions and landmarks for providers (in draft).",
      starters: ["Help me write clear directions to my home"],
    },
    {
      key: "settings",
      prefix: "/account/settings",
      label: "Settings",
      requirements: "AU-06, AU-07",
      focus: "Profile, interests and account settings, including deleting the account.",
      starters: ["How do I change my name or photo?", "How do I delete my account?"],
    },
    {
      key: "notifications",
      prefix: "/account/notifications",
      label: "Notifications",
      requirements: "SY-02",
      focus: "Their notifications: explain what each kind means and what to do next.",
      starters: ["What should I do about my latest notifications?"],
    },
  ],
  provider: [
    {
      key: "home",
      prefix: "/provider",
      exact: true,
      label: "Home",
      requirements: "PR-03, PR-14",
      focus: "Overview. Prioritise today from the dashboard data: bookings to accept, today's jobs, new matching requests, pending quotes, setup gaps and verification.",
      starters: ["What should I do first today?", "How can I get more bookings?", "إزاي أزود عدد الحجوزات بتاعتي؟"],
    },
    {
      key: "requests",
      prefix: "/provider/requests",
      label: "Available requests",
      requirements: "PR-06, PR-07, SY-01",
      focus:
        "Requests matching their categories and areas (SY-01). Help pick which to quote, suggest a fair price range (in the app currency) from the listed catalog prices and the job details, list what the price should include and questions to ask, and write a professional quote message in draft (scope, materials, duration, exclusions). Price changes after an inspection need both sides' explicit agreement (BR-07).",
      starters: ["Help me price and write a quote for the latest request", "Which request should I quote first?", "What questions should I ask the customer?"],
    },
    {
      key: "quotes",
      prefix: "/provider/quotes",
      label: "Quotes",
      requirements: "PR-07",
      focus: "Quotes they sent. Help improve quotes that aren't being accepted (clearer scope, materials, timeline, competitive price, fast response) and write a better quote message in draft.",
      starters: ["Why aren't customers accepting my quotes?", "Rewrite my quote message to be more convincing"],
    },
    {
      key: "bookings",
      prefix: "/provider/bookings",
      label: "My bookings",
      requirements: "PR-08",
      focus:
        "Their bookings: accept or reject quickly, start, then mark finished (PR-08). Payment is released after the customer confirms or the objection window ends (BR-08). Help write messages about delays, arrival, or extra work — extra work must be agreed through the platform (BR-07).",
      starters: ["How should I handle a booking I can't make?", "Write a message: I'll be 30 minutes late", "The customer wants extra work — what do I do?"],
    },
    {
      key: "messages",
      prefix: "/provider/messages",
      label: "Messages",
      requirements: "PR-09, SY-04",
      focus: "Chat with customers. Write professional, friendly replies in draft. Contact details stay hidden until a booking is confirmed (BR-02); never suggest moving the conversation off-platform (SY-04).",
      starters: ["Write a polite reply to a customer asking for a discount", "How do I explain a price increase?"],
    },
    {
      key: "services",
      prefix: "/provider/services",
      label: "My services",
      requirements: "PR-05",
      focus:
        "Their fixed-price services (title, description, price, category, duration). Write or improve a service in draft: a clear, searchable title, what's included and not included, duration, and a competitive price compared with the listed catalog prices.",
      starters: ["Write a description for a new service", "Is my price competitive?", "What services should I add?"],
    },
    {
      key: "portfolio",
      prefix: "/provider/portfolio",
      label: "Portfolio",
      requirements: "PR-04",
      focus: "Their portfolio of work photos. Advise which projects and photos convince customers (before/after, good light, finished details) and write short captions in draft.",
      starters: ["What photos should I add to my portfolio?", "Write captions for my project photos"],
    },
    {
      key: "schedule",
      prefix: "/provider/schedule",
      label: "Schedule",
      requirements: "PR-10",
      focus: "Their weekly availability and time off. Help plan working hours, travel time between areas, and buffer time for longer jobs.",
      starters: ["How should I set my working hours?", "How much buffer should I leave between jobs?"],
    },
    {
      key: "reviews",
      prefix: "/provider/reviews",
      label: "Reviews",
      requirements: "PR-13, SY-05",
      focus: "Their reviews. Write calm, professional replies in draft — especially to negative reviews — and suggest how to improve ratings. A low rating over several bookings can put the account under review (BR-04).",
      starters: ["Write a reply to a negative review", "How can I improve my rating?"],
    },
    {
      key: "earnings",
      prefix: "/provider/earnings",
      label: "Earnings",
      requirements: "PR-11, BR-01",
      focus: "Earnings and wallet: amount due, collected, and commission deducted (BR-01; the rate is set by Livo — see the figures on the page, don't state a rate). Explain a negative balance (commission owed on cash jobs) using the dashboard numbers.",
      starters: ["Explain my wallet balance", "Why is my balance negative?", "When will I receive my money?"],
    },
    {
      key: "payouts",
      prefix: "/provider/payouts",
      label: "Payouts",
      requirements: "PR-12",
      focus: "Payout requests: how to request a withdrawal from the available balance and what happens next. Point to the page for limits and status.",
      starters: ["How do I request a payout?", "Why can't I withdraw my full balance?"],
    },
    {
      key: "verification",
      prefix: "/provider/verification",
      label: "Verification",
      requirements: "PR-02, PR-03, AD-01",
      focus: "Verification documents (ID, photo, certificates if any) and account status (under review / active / suspended). If rejected, explain the reason from the data and exactly what to fix.",
      starters: ["What documents do I need?", "Why was my verification rejected?", "How long does review take?"],
    },
    {
      key: "settings",
      prefix: "/provider/settings",
      label: "Settings",
      requirements: "PR-01, AU-06",
      focus: "Profile: specialties, experience, coverage areas and bio. Write a strong bio in draft and advise which areas to cover.",
      starters: ["Write a professional bio for my profile", "Which areas should I cover?"],
    },
    {
      key: "notifications",
      prefix: "/provider/notifications",
      label: "Notifications",
      requirements: "SY-02",
      focus: "Their notifications: explain what each kind means and what to do next.",
      starters: ["What should I act on first?"],
    },
  ],
  admin: [
    {
      key: "home",
      prefix: "/admin",
      exact: true,
      label: "Dashboard",
      requirements: "AD-09",
      focus: "KPIs (users, requests, booking value/GMV, commission) and the attention queue. Summarise the platform's state and what to handle first.",
      starters: ["What needs my attention today?", "Summarise the platform's KPIs", "What do these numbers suggest we improve?"],
    },
    {
      key: "providers",
      prefix: "/admin/providers",
      label: "Provider applications",
      requirements: "AD-01, PR-02, PR-03",
      focus:
        "Reviewing provider applications: a checklist for documents (clear ID matching the name, real photo, relevant certificates), experience, categories and areas. Write a clear, respectful rejection reason or approval note in draft — the provider is notified of the decision.",
      starters: ["Give me a checklist for reviewing an application", "Write a rejection reason for a blurry ID photo"],
    },
    {
      key: "users",
      prefix: "/admin/users",
      label: "Users",
      requirements: "AD-03",
      focus: "Managing users: when suspending or reactivating is justified, what to check first, and a clear message to the user in draft.",
      starters: ["When should I suspend a user?", "Write a suspension notice"],
    },
    {
      key: "categories",
      prefix: "/admin/categories",
      label: "Categories",
      requirements: "AD-02",
      focus: "Categories (fixed, quote or both; parent/sub-categories). Suggest structure and write SEO-friendly names and descriptions in draft. Use the live categories listed above.",
      starters: ["Write a description for a category", "Should this category be fixed-price or quote-based?", "Which categories are we missing?"],
    },
    {
      key: "services",
      prefix: "/admin/services",
      label: "Services",
      requirements: "AD-02",
      focus: "Moderating providers' fixed-price services: what makes a listing misleading or low quality, prices far off the category's listed range, and when to hide one.",
      starters: ["What should I check when reviewing services?", "Which prices look unusual?"],
    },
    {
      key: "requests",
      prefix: "/admin/requests",
      label: "Requests and quotes",
      requirements: "AD-04, BR-05",
      focus: "All quote requests and quotes: spotting stuck requests (no quotes, expiring — BR-05), spam, or contact details in text (SY-04).",
      starters: ["How do I spot problem requests?", "Why do some requests get no quotes?"],
    },
    {
      key: "bookings",
      prefix: "/admin/bookings",
      label: "Bookings",
      requirements: "AD-04, BR-06, BR-08",
      focus: "All bookings: stuck states (waiting for the provider, not confirmed), cancellations (BR-06) and held payments (BR-08). What to check and when to step in.",
      starters: ["Which bookings need intervention?", "How should we handle a no-show provider?"],
    },
    {
      key: "disputes",
      prefix: "/admin/disputes",
      label: "Disputes",
      requirements: "AD-05, CU-12",
      focus:
        "Resolving disputes: review the evidence from both sides (chat, photos, booking timeline), decide a full, partial or no refund, and record clear reasoning (it goes to the audit log). Give a fair decision framework and write the decision message in draft. Don't decide for them — give options and trade-offs.",
      starters: ["Help me decide a dispute fairly", "Write a decision message for a partial refund", "What evidence should I look at?"],
    },
    {
      key: "reviews",
      prefix: "/admin/reviews",
      label: "Reviews",
      requirements: "AD-08",
      focus: "Moderating reviews: hide only those that break the rules (abuse, contact details, spam, unrelated), not honest negative ones.",
      starters: ["When should I hide a review?"],
    },
    {
      key: "payments",
      prefix: "/admin/payments",
      label: "Payments",
      requirements: "AD-07",
      focus: "Reviewing payments: held, released, refunded, failed; what anomalies to look for.",
      starters: ["What should I look for in payments?", "Explain held vs released payments"],
    },
    {
      key: "payouts",
      prefix: "/admin/payouts",
      label: "Payout requests",
      requirements: "AD-07, PR-12",
      focus: "Approving, rejecting and marking payouts paid: what to check (balance, recent disputes or refunds, account status) and a rejection message in draft.",
      starters: ["What should I check before approving a payout?", "Write a payout rejection message"],
    },
    {
      key: "commission",
      prefix: "/admin/settings/commission",
      label: "Commission",
      requirements: "AD-06, BR-01",
      focus: "Commission settings (global rate, per-category overrides). Discuss trade-offs of raising or lowering a rate for supply and demand; don't invent the current rate — it's on the page.",
      starters: ["Should we charge a different rate for big projects?", "What happens if we lower commission?"],
    },
    {
      key: "content",
      prefix: "/admin/content",
      label: "Page content",
      requirements: "AD-10, MK-05",
      focus: "Static pages (about, contact, terms, privacy, FAQ, policies). Write or improve clear, friendly page copy in draft; recommend legal review for terms and privacy.",
      starters: ["Write FAQ answers about payments", "Improve our About page text"],
    },
    {
      key: "audit",
      prefix: "/admin/audit-log",
      label: "Audit log",
      requirements: "AD-11",
      focus: "The audit log: what to look for when investigating an action, and good practice for admin decisions.",
      starters: ["What should I look for in the audit log?"],
    },
  ],
}
