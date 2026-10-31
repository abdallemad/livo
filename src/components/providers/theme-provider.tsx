"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/** Class strategy, light by default (docs/DESIGN-SYSTEM.md §16 overrides CLAUDE.md §9). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
