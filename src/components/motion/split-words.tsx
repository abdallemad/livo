/**
 * Headline text animation that runs at first paint (CSS `word-in` in `globals.css`), for the hero `<h1>` — the LCP
 * element mustn't wait for hydration. Each word rises in, 70 ms after the previous. Server-safe.
 *
 * Accessibility / SEO: the heading keeps one real text copy (the words are plain text in the DOM, in order, with real
 * spaces), and `aria-label` on the heading gives screen readers the sentence in one piece.
 */
export function SplitWords({ text, delayMs = 0, stepMs = 70 }: { text: string; delayMs?: number; stepMs?: number }) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span aria-hidden>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="word-in" style={{ animationDelay: `${delayMs + i * stepMs}ms` }}>
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  )
}
