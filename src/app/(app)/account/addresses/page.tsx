import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/addresses — docs/SITEMAP.md (CU-14). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Addresses" }

export default function AccountAddressesPage() {
  return <PagePlaceholder title={"Addresses"} description={"Your saved addresses for faster booking."} route="/account/addresses" reqs={["CU-14"]} />
}
