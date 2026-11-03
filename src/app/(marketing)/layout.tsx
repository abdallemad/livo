import { AssistantLauncher } from "@/components/ai-assistant"
import { AppFooter } from "@/components/layout/AppFooter"
import { AppHeader } from "@/components/layout/AppHeader"

/** Header-only public shell. Reads nothing from the request (CLAUDE.md §4.1). */
export const revalidate = 3600

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
      {/* Client island: the floating Livo AI Assistant (docs/ai-assistant-feature.md). */}
      <AssistantLauncher />
    </>
  )
}
