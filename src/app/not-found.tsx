import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">الصفحة غير موجودة.</p>
      <Button variant="outline" render={<Link href="/" />}>
        العودة للرئيسية
      </Button>
    </main>
  )
}
