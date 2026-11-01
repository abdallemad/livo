import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LANDING_FAQ } from "@/constants/trust"

/**
 * FAQ (docs/landing-page.md §10): shadcn (Base UI) accordion; every answer is `keepMounted` + `hiddenUntilFound`, so it's
 * in the server HTML (crawlers, find-in-page) even while collapsed. The same entries feed the FAQPage JSON-LD.
 */
export function LandingFaq() {
  return (
    <section aria-labelledby="faq-title" className="defer-render">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6">
        <h2 id="faq-title" className="text-2xl font-semibold md:text-3xl">
          Questions people ask before booking
        </h2>
        <Accordion className="max-w-3xl">
          {LANDING_FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="py-4 text-base">{item.q}</AccordionTrigger>
              <AccordionContent keepMounted hiddenUntilFound className="text-base text-muted-foreground">
                <p>{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
