import { cn } from "@/lib/utils"

/**
 * Admin-written `StaticPage` HTML (AD-10) on a white rounded panel. The html MUST come from `getPublishedPage()`,
 * which sanitises it — so `dangerouslySetInnerHTML` only ever receives allow-listed markup. Same typography as
 * `StaticPageView`.
 */
export function CmsBody({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-[28px] border bg-card/95 p-6 text-base leading-relaxed shadow-card md:p-10 [&_a]:font-medium [&_a]:text-violet [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-primary [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold md:[&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:font-semibold [&_h3:first-child]:mt-0 [&_li]:ms-5 [&_li]:marker:text-coral [&_ol]:list-decimal [&_p]:text-muted-foreground [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
