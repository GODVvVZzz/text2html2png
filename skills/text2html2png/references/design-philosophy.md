# Design philosophy

Use this reference when a diagram is visually complex or the first render needs refinement.

## 1. Fidelity before decoration

The diagram must preserve the user's facts and relationships. Visual polish never justifies inventing a metric, date, person, trend, recommendation, or dependency. Shorten and organize source content, but do not manufacture content to fill a template.

If the source is sparse, make a smaller composition. Intentional whitespace is better than false precision.

## 2. Clear hierarchy

- Main title > subtitle > section/card title > body > auxiliary label.
- Center the page title and summary; left-align paragraphs and descriptions.
- Keep one obvious reading order.
- Use size, weight, spacing, and shape in addition to color.
- Body text and essential labels should meet WCAG AA contrast where practical.

## 3. Balanced density

Static diagrams should feel composed, not cramped or empty.

| Element | Typical range |
|---|---:|
| Canvas padding | 20–32px |
| Gap between peer cards | 8–16px |
| Card padding | 12–20px |
| Title to content | 12–20px |
| Connector lane | 20–36px |

Use the lower end for dense content and the upper end for short content. Equal-width peer cards are a good default, but semantic importance may justify unequal sizes.

## 4. Layout follows meaning

- Sequence: flow in one clear direction.
- Comparison: align equivalent dimensions across columns.
- Timeline: keep dates and events visibly attached.
- Architecture: group by layer or boundary; keep arrows behind nodes.
- Dashboard: emphasize only metrics supplied by the user.
- Gantt: maintain a stable time scale across every row.
- Org chart: preserve reporting lines and sibling alignment.
- Funnel: make stage widths and percentages reflect supplied values.

Prefer CSS Grid/Flexbox for primary structure. Use SVG only for connectors or shapes that CSS cannot express cleanly. Compute connector positions from the final layout or a documented coordinate formula; example coordinates are never universal.

## 5. A distinct but restrained visual identity

- Choose one dominant palette plus one or two accents.
- Keep card radii, border weights, and shadow depth consistent.
- Use at most one icon language per diagram: inline SVG, geometric symbols, or text labels.
- Avoid decorative gradients, glow, shadows, and textures that reduce legibility.
- Use local font stacks by default. Web fonts are optional only when the user allows network access.

## 6. Robust text behavior

- Escape all user-provided text before putting it into HTML.
- Set sensible maximum line lengths and allow wrapping.
- Do not shrink important text to solve overflow; widen, regroup, or split the layout.
- Test long English words, CJK text, numbers, punctuation, and mixed-language labels.

## Visual QA checklist

- No clipping, overlap, or off-canvas shadow.
- No connector crosses text or terminates ambiguously.
- Equivalent items align.
- The reading order is obvious without a legend.
- Meaning survives grayscale.
- Every number and claim is grounded in the source.
- The image remains readable when pasted into a normal-width document.

## Common failure modes

| Failure | Better response |
|---|---|
| Repeating the same sentence in subtitle and footer | Keep one, or give each a different role |
| Adding invented stats to fill space | Reduce the composition or use whitespace |
| Rainbow palette | One dominant palette plus limited accents |
| Fixed connector coordinates copied from an example | Derive positions from the actual node count/layout |
| Tiny text to preserve a fixed canvas | Reflow, widen, or split |
| Remote font required for layout | Use local fallbacks; remote fonts are optional |
| Every card identical despite different semantics | Preserve peer consistency while emphasizing genuine hierarchy |
