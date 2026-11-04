import "server-only"
import { Type, type Schema } from "@google/genai"
import { LAUNCH_CITY, SITE_NAME } from "@/constants/site"
import { RateLimitError, ServiceUnavailableError } from "@/lib/errors"
import { getGemini } from "@/lib/gemini"
import { createRateLimiter } from "@/lib/rate-limit"
import { catalogRepository } from "@/repositories/catalog.repository"
import { assistantModelReplySchema, type AssistantChatValues } from "@/schemas/ai-assistant.schema"
import { VISIBLE_SERVICE } from "@/services/admin-catalog.service"
import { getAdminDashboard } from "@/services/admin-dashboard.service"
import { getCustomerDashboard } from "@/services/customer.service"
import { getProviderDashboard } from "@/services/provider-dashboard.service"
import type { AssistantMode, AssistantReply } from "@/types/ai-assistant"
import {
  adminSnapshot,
  assistantActions,
  buildAdminInstruction,
  buildCustomerInstruction,
  buildProviderInstruction,
  buildSystemInstruction,
  customerSnapshot,
  isRetryableGeminiError,
  providerSnapshot,
  resolveAssistantSection,
  toAssistantReply,
  toGeminiContents,
  type AssistantCategory,
  type AssistantViewer,
} from "@/utils/ai-assistant"

/**
 * Livo AI Assistant (docs/ai-assistant-feature.md). Answers with Google Gemini in three modes:
 * - public (marketing pages): grounded in the LIVE catalog (active categories + real listed prices);
 * - customer (`/account`): + the customer's own dashboard (to-dos, bookings, open requests);
 * - provider (`/provider`): + the provider's dashboard (eligibility, setup gaps, new requests, today's jobs, money);
 * - admin (`/admin`): + platform KPIs and queues (no customer/provider names).
 * Dashboard modes also focus on the page the panel is open on (`input.path` → a known section, never prompted verbatim).
 * The dashboard snapshot is loaded here from the SESSION user's id — never from the request body. The model returns
 * JSON that is re-validated and mapped to links from fixed tables; it never builds a URL itself. Nothing is stored.
 */

/** Per-model timeout; with the fallback the whole turn stays under ~25 s. */
const TIMEOUT_MS = 12_000
const CONTEXT_TTL_MS = 10 * 60_000

/** 8 messages a minute and 60 an hour per visitor (user id, else IP), shared by all modes, keep one tab from draining the Gemini quota. */
const perMinute = createRateLimiter({ limit: 8, windowMs: 60_000 })
const perHour = createRateLimiter({ limit: 60, windowMs: 60 * 60_000 })

/** Gemini's JSON response schema; `action` is limited to the mode's link keys. */
function responseSchema(mode: AssistantMode): Schema {
  return {
    type: Type.OBJECT,
    properties: {
      reply: { type: Type.STRING, description: "The answer shown to the user, plain text." },
      action: { type: Type.STRING, enum: assistantActions(mode) },
      categorySlug: { type: Type.STRING, nullable: true, description: "One of the listed category slugs, or null." },
      estimatedPrice: { type: Type.STRING, nullable: true, description: 'Price or range in USD, e.g. "$250–$400", or null.' },
      tips: { type: Type.ARRAY, items: { type: Type.STRING } },
      quickReplies: { type: Type.ARRAY, items: { type: Type.STRING } },
      draft: { type: Type.STRING, nullable: true, description: "Ready-to-paste text you wrote for the user, or null." },
    },
    required: ["reply", "action", "tips", "quickReplies"],
    propertyOrdering: ["reply", "action", "categorySlug", "estimatedPrice", "tips", "quickReplies", "draft"],
  }
}

let cachedContext: { at: number; categories: AssistantCategory[] } | undefined

/** Active categories with their live price range; cached in memory for 10 min (the catalog changes rarely). */
async function loadCatalogContext(): Promise<AssistantCategory[]> {
  if (cachedContext && Date.now() - cachedContext.at < CONTEXT_TTL_MS) return cachedContext.categories
  const [rows, stats] = await Promise.all([catalogRepository.findActiveCategories(), catalogRepository.priceStatsByCategory(VISIBLE_SERVICE)])
  const byId = new Map(stats.map((s) => [s.categoryId, s]))
  const nameById = new Map(rows.map((r) => [r.id, r.nameEn ?? r.nameAr]))
  const categories = rows.map((r): AssistantCategory => {
    const s = byId.get(r.id)
    return {
      slug: r.slug,
      name: r.nameEn ?? r.nameAr,
      description: r.description,
      type: r.type,
      parentName: r.parentId ? (nameById.get(r.parentId) ?? null) : null,
      serviceCount: s?._count._all ?? 0,
      priceRange:
        s?._min.price && s._max.price ? { min: Number(s._min.price.toString()), max: Number(s._max.price.toString()) } : null,
    }
  })
  cachedContext = { at: Date.now(), categories }
  return categories
}

/** One Gemini turn: try each configured model in order; a busy (503) or rate-limited (429) model falls through. */
async function generate(
  input: AssistantChatValues,
  mode: AssistantMode,
  systemInstruction: string,
  categories: AssistantCategory[],
): Promise<AssistantReply> {
  const { client, models } = getGemini()

  let text: string | undefined
  for (const [i, model] of models.entries()) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: toGeminiContents(input.messages),
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema(mode),
          temperature: 0.4,
          // Room for a draft (quote message, service description) without cutting the JSON short.
          maxOutputTokens: 2048,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      })
      text = response.text
      break
    } catch (error) {
      const retry = isRetryableGeminiError(error) && i < models.length - 1
      console.warn(`[ai-assistant] ${model} failed${retry ? ", trying the next model" : ""}:`, error instanceof Error ? error.message : error)
      // Bad key, blocked prompt, or every model busy: tell the user to retry (the cause is in the log above).
      if (!retry) throw new ServiceUnavailableError("The Livo assistant is busy right now. Try again in a moment.")
    }
  }

  let json: unknown
  try {
    json = JSON.parse(text ?? "")
  } catch {
    json = undefined
  }
  const parsed = assistantModelReplySchema.safeParse(json)
  if (!parsed.success) {
    console.error("[ai-assistant] Unexpected model output", text?.slice(0, 500))
    throw new ServiceUnavailableError("The Livo assistant couldn't answer that. Try rephrasing your question.")
  }
  return toAssistantReply(parsed.data, categories, mode)
}

function limit(key: string) {
  if (!perMinute.hit(key) || !perHour.hit(key)) throw new RateLimitError()
}

/** Marketing pages: anyone. `key` is the user id or the client IP. */
export async function askAssistant(input: AssistantChatValues, visitor: { key: string; viewer: AssistantViewer }): Promise<AssistantReply> {
  limit(visitor.key)
  getGemini() // 503 before any DB work when the assistant isn't configured
  const categories = await loadCatalogContext()
  const instruction = buildSystemInstruction({ siteName: SITE_NAME, city: LAUNCH_CITY, categories, viewer: visitor.viewer })
  return generate(input, "public", instruction, categories)
}

/** Customer dashboard: grounded in the signed-in customer's own requests and bookings. */
export async function askCustomerAssistant(input: AssistantChatValues, customerId: string): Promise<AssistantReply> {
  limit(`user:${customerId}`)
  getGemini()
  const [categories, dashboard] = await Promise.all([loadCatalogContext(), getCustomerDashboard(customerId)])
  const instruction = buildCustomerInstruction({
    siteName: SITE_NAME,
    city: LAUNCH_CITY,
    categories,
    snapshot: customerSnapshot(dashboard),
    section: resolveAssistantSection("customer", input.path),
  })
  return generate(input, "customer", instruction, categories)
}

/** Provider dashboard: grounded in the signed-in provider's eligibility, setup, requests, bookings and money. */
export async function askProviderAssistant(input: AssistantChatValues, providerId: string): Promise<AssistantReply> {
  limit(`user:${providerId}`)
  getGemini()
  const [categories, dashboard] = await Promise.all([loadCatalogContext(), getProviderDashboard(providerId)])
  const instruction = buildProviderInstruction({
    siteName: SITE_NAME,
    city: LAUNCH_CITY,
    categories,
    snapshot: providerSnapshot(dashboard),
    section: resolveAssistantSection("provider", input.path),
  })
  return generate(input, "provider", instruction, categories)
}

/** Admin dashboard: platform KPIs and queues; advice only — every decision stays with the admin. */
export async function askAdminAssistant(input: AssistantChatValues, adminId: string): Promise<AssistantReply> {
  limit(`user:${adminId}`)
  getGemini()
  const [categories, dashboard] = await Promise.all([loadCatalogContext(), getAdminDashboard()])
  const instruction = buildAdminInstruction({
    siteName: SITE_NAME,
    city: LAUNCH_CITY,
    categories,
    snapshot: adminSnapshot(dashboard),
    section: resolveAssistantSection("admin", input.path),
  })
  return generate(input, "admin", instruction, categories)
}
