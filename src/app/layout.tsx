import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { GoogleAnalytics } from "@next/third-parties/google"
import { IBM_Plex_Sans, Readex_Pro } from "next/font/google"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { getSiteUrl } from "@/lib/site-url"
import {
  DEFAULT_OPEN_GRAPH,
  SITE_DESCRIPTION,
  SITE_DIR,
  SITE_LANG,
  SITE_NAME,
  SITE_TITLE,
} from "@/constants/site"
import "./globals.css"

/**
 * Root layout: owns <html>/<body> and the providers so moving between route
 * groups stays a client-side navigation. It reads NOTHING from the request
 * (no auth(), cookies(), headers()) — that would make every page dynamic.
 * `<ClerkProvider>` stays static: never pass it the `dynamic` prop.
 */
/** Body / UI text (docs/DESIGN-SYSTEM.md §3). */
const fontBody = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

/** Headings / display. */
const fontDisplay = Readex_Pro({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { ...DEFAULT_OPEN_GRAPH, title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
}

const gaId = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang={SITE_LANG}
        dir={SITE_DIR}
        className={`${fontBody.variable} ${fontDisplay.variable} antialiased`}
        suppressHydrationWarning
      >
        <body className="flex min-h-dvh flex-col bg-background text-foreground">
          {/* Base UI reads direction from here: menus, tabs, sliders and arrow keys follow the document direction. */}
          <DirectionProvider direction={SITE_DIR}>
            <ThemeProvider>
              <QueryProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </QueryProvider>
            </ThemeProvider>
          </DirectionProvider>
        </body>
        {process.env.NODE_ENV === "production" && gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </html>
    </ClerkProvider>
  )
}
