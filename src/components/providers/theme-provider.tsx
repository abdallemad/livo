"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/** Class strategy, dark by default (CLAUDE.md §9). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
