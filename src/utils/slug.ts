/**
 * Pure slug helpers. Arabic letters are kept (URLs are percent-encoded by the
 * browser and Google indexes them fine); everything else collapses to `-`.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics (tashkeel)
    .replace(/[̀-ͯ]/g, "") // Latin combining marks
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Appends `-2`, `-3`… until `isTaken` returns false. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item"
  let candidate = root
  for (let n = 2; await isTaken(candidate); n++) candidate = `${root}-${n}`
  return candidate
}
