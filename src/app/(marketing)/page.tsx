import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants/site"

/** Landing page placeholder (SRS MK-01). Static: no request or DB reads. */
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{SITE_NAME}</h1>
      <p className="text-lg text-muted-foreground">{SITE_DESCRIPTION}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" render={<Link href="/sign-up" />}>
          اطلب خدمة
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/sign-up" />}>
          انضم كمزود خدمة
        </Button>
      </div>
    </section>
  )
}
