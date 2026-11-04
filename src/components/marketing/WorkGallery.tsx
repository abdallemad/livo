import { PublicImage } from "@/components/shared/public-image"
import type { GalleryImage } from "@/types/landing"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

/**
 * Real work gallery (docs/landing-page.md §7): providers' own portfolio photos, labelled with the provider's specialty
 * and area. Hidden when there are fewer than `MIN_GALLERY_IMAGES` (the service returns an empty list).
 */
export function WorkGallery({ images }: { images: GalleryImage[] }) {
  if (!images.length) return null
  return (
    <section aria-labelledby="gallery-title" className="defer-render bg-page-gradient">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <SectionHeading id="gallery-title" ghost="Work" title="Real work by our providers" lead="Photos uploaded by the providers themselves." className="mb-8 md:mb-10" />
        <StaggerList className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.map((img) => (
            <StaggerItem key={img.id} lift>
              <figure className="overflow-hidden rounded-3xl border bg-card shadow-soft">
                <PublicImage src={img.url} alt={img.title} width={400} height={300} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="space-y-0.5 p-3.5">
                  <span className="line-clamp-1 block text-sm font-semibold">{img.title}</span>
                  {img.label ? <span className="block text-xs text-muted-foreground">{img.label}</span> : null}
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  )
}
