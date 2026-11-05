import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

/**
 * FAQ accordion (Base UI). Answers are `keepMounted` + `hiddenUntilFound`, so they're in the server HTML for crawlers
 * and find-in-page even while collapsed — pair with `faqJsonLd()` on the page.
 */
export function FaqList({ items, idPrefix, className }: { items: readonly { q: string; a: string }[]; idPrefix: string; className?: string }) {
  return (
    <Accordion className={cn("rounded-[28px] border bg-card px-5 shadow-soft md:px-7", className)}>
      {items.map((item, i) => (
        <AccordionItem key={item.q} value={`${idPrefix}-${i}`} className="last:border-b-0">
          <AccordionTrigger className="py-5 text-start text-[clamp(15.5px,1.4vw,17.5px)]">{item.q}</AccordionTrigger>
          <AccordionContent keepMounted hiddenUntilFound className="text-[15px] text-muted-foreground">
            <p>{item.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
