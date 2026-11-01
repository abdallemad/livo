import { absoluteUrl } from "@/lib/site-url"
import { SITE_LOGO, SITE_NAME } from "@/constants/site"

/** Pure JSON-LD builders rendered through `<JsonLd>`. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl(SITE_LOGO),
  }
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

/** A listing page's items (category page): each fixed-price service with its URL and price (MK-02). */
export function serviceListJsonLd(name: string, items: { title: string; href: string; price: number }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((s, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(s.href),
      item: {
        "@type": "Service",
        name: s.title,
        url: absoluteUrl(s.href),
        offers: { "@type": "Offer", price: s.price.toFixed(2), priceCurrency: "EGP" },
      },
    })),
  }
}

/** `/services`: the categories as a list of links. */
export function categoryListJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Service categories",
    itemListElement: items.map((c, index) => ({ "@type": "ListItem", position: index + 1, name: c.name, url: absoluteUrl(c.path) })),
  }
}

/**
 * `/services/[category]/[service]`: a fixed-price `Service` with its `Offer` (EGP) and the provider by name.
 * No `aggregateRating`: the rating belongs to the provider, not this service, and marking it up as the
 * service's would misrepresent it.
 */
export function serviceJsonLd(s: { title: string; description: string; href: string; price: number; category: string; provider: string; city: string; images: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    url: absoluteUrl(s.href),
    serviceType: s.category,
    areaServed: { "@type": "City", name: s.city },
    provider: { "@type": "Person", name: s.provider },
    ...(s.images.length ? { image: s.images.map((i) => absoluteUrl(i)) } : {}),
    offers: { "@type": "Offer", price: s.price.toFixed(2), priceCurrency: "EGP", url: absoluteUrl(s.href), availability: "https://schema.org/InStock" },
  }
}
