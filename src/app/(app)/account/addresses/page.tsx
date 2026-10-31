import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/addresses — docs/SITEMAP.md (CU-14). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "العناوين" }

export default function AccountAddressesPage() {
  return <PagePlaceholder title={"العناوين"} description={"عناوينك المحفوظة للحجز بسرعة."} route="/account/addresses" reqs={["CU-14"]} />
}
