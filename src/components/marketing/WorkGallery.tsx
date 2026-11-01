import { PublicImage } from "@/components/shared/public-image"
import type { GalleryImage } from "@/types/landing"

/**
 * Real work gallery (docs/landing-page.md §7): providers' own portfolio photos, labelled with the provider's specialty
 * and area. Hidden when there are fewer than `MIN_GALLERY_IMAGES` (the service returns an empty list).
 */
export function WorkGallery({ images }: { images: GalleryImage[] }) {
  if (!images.length) return null
  return (
    <section aria-labelledby="gallery-title" className="defer-render bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6">
        <div className="space-y-1">
          <h2 id="gallery-title" className="text-2xl font-semibold md:text-3xl">Real work by our providers</h2>
          <p className="text-muted-foreground">Photos uploaded by the providers themselves.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((img) => (
            <li key={img.id}>
              <figure className="overflow-hidden rounded-xl border bg-card">
                <PublicImage src={img.url} alt={img.title} width={400} height={300} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="space-y-0.5 p-2.5">
                  <span className="line-clamp-1 block text-sm font-medium">{img.title}</span>
                  {img.label ? <span className="block text-xs text-muted-foreground">{img.label}</span> : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
