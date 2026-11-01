import sanitizeHtml from "sanitize-html"

/**
 * `StaticPage.body` → safe HTML for public pages (docs/landing-page.md). Bodies are meant to be stored sanitised
 * (schema comment), but they're rendered with `dangerouslySetInnerHTML`, so we sanitise again at render: headings,
 * paragraphs, lists, emphasis and links only; no scripts, styles, iframes, event handlers or `javascript:` URLs.
 */
export function sanitizePageHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "h4", "p", "br", "ul", "ol", "li", "strong", "em", "b", "i", "a", "blockquote", "hr"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  })
}
