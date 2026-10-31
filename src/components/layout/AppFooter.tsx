import { SITE_NAME } from "@/constants/site"

export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  )
}
