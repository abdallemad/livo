import { API_ROUTES } from "@/constants/api-routes"
import { SITE_NAME } from "@/constants/site"
import type { AssistantMode } from "@/types/ai-assistant"

/**
 * Per-mode copy and endpoint for the Livo AI Assistant UI (docs/ai-assistant-feature.md). The server decides what each
 * mode knows and may link to; this is only what the panel shows before the first answer.
 */
export interface AssistantModeConfig {
  endpoint: string
  title: string
  description: string
  welcomeTitle: string
  welcome: string
  starters: readonly string[]
  placeholder: string
  disclaimer: string
}

export const ASSISTANT_MODES: Record<AssistantMode, AssistantModeConfig> = {
  public: {
    endpoint: API_ROUTES.assistantChat,
    title: `${SITE_NAME} Assistant`,
    description: "Diagnose a problem, estimate the cost, find the right service.",
    welcomeTitle: `Hi! I'm the ${SITE_NAME} Assistant.`,
    welcome:
      "Describe a problem or a project — I'll suggest what's wrong, a rough price in EGP, and the right next step. You can write in English or Arabic.",
    starters: ["My kitchen sink is leaking", "How much does AC maintenance cost?", "I want to finish a 120 m² apartment", "عندي ماس كهربا في الشقة"],
    placeholder: "Describe your problem or project…",
    disclaimer: "AI answers can be wrong — final prices come from providers.",
  },
  customer: {
    endpoint: API_ROUTES.customerAssistant,
    title: `${SITE_NAME} Assistant`,
    description: "Help with your requests, bookings and home jobs.",
    welcomeTitle: "Hi! How can I help with your home today?",
    welcome:
      "I can see your requests and bookings. Ask what needs your attention, get help writing a quote request, compare quotes, or describe a problem for a quick diagnosis and price idea.",
    starters: [
      "What needs my attention?",
      "Help me write a quote request",
      "How do I compare the quotes I got?",
      "عندي تسريب مياه في الحمام",
    ],
    placeholder: "Ask about your jobs or describe a problem…",
    disclaimer: "AI answers can be wrong — check details on the booking or request page.",
  },
  provider: {
    endpoint: API_ROUTES.providerAssistant,
    title: `${SITE_NAME} Work Assistant`,
    description: "Win jobs, price quotes, write messages and manage your work.",
    welcomeTitle: "Hi! Let's get more work done.",
    welcome:
      "I can see your requests, bookings, setup and earnings. Ask me what to do first, help pricing a quote, write a quote message or a service description, or reply to a customer.",
    starters: [
      "What should I do first today?",
      "Help me price and write a quote for the latest request",
      "Write a description for a new fixed-price service",
      "إزاي أزود عدد الحجوزات بتاعتي؟",
    ],
    placeholder: "Ask about your work, a quote or a customer…",
    disclaimer: "AI suggestions can be wrong — you decide your prices and what you send.",
  },
  admin: {
    endpoint: API_ROUTES.adminAssistant,
    title: `${SITE_NAME} Admin Assistant`,
    description: "Prioritise queues, review providers, resolve disputes, write copy.",
    welcomeTitle: "Hi! Let's keep the platform running smoothly.",
    welcome:
      "I can see the platform's KPIs and queues. Ask what to handle first, get a checklist for reviewing a provider, a fair way to decide a dispute, or help writing decisions and page copy. You make every decision.",
    starters: ["What needs my attention today?", "Summarise the platform's KPIs", "Help me decide a dispute fairly"],
    placeholder: "Ask about the queues, a decision or page copy…",
    disclaimer: "AI suggestions can be wrong — you make and check every decision.",
  }
}
