// Shared monochrome inline SVG icons. Every path uses currentColor so the
// active theme decides the color; no literal color values are allowed here.

function svg(paths) {
  return ['<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">', ...paths, "</svg>"].join("");
}

export function iconSvg(kind) {
  switch (kind) {
    case "code":
      return svg([
        '<path d="M12 9L5 16l7 7M20 9l7 7-7 7M18.5 6l-5 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "image":
      return svg([
        '<rect x="4.5" y="5.5" width="23" height="21" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
        '<circle cx="11" cy="12" r="2.2" fill="currentColor"/>',
        '<path d="M7.5 23l6.2-6.4 4.2 4 3.2-3.2 3.4 5.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "chart":
      return svg([
        '<path d="M9.5 26V15.5M16 26V6.5M22.5 26V11M4 26.5h24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
      ]);
    case "layers":
      return svg([
        '<path d="M16 4.5l11.5 5.8L16 16.1 4.5 10.3 16 4.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
        '<path d="M4.5 16.2l11.5 5.8 11.5-5.8M4.5 22l11.5 5.8L27.5 22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "package":
      return svg([
        '<path d="M16 4.5l11 6.2v10.6l-11 6.2-11-6.2V10.7l11-6.2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
        '<path d="M5.4 10.9L16 17l10.6-6.1M16 17v10.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'
      ]);
    case "lock":
      return svg([
        '<rect x="7" y="14.5" width="18" height="12.5" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/>',
        '<path d="M11 14.5V10a5 5 0 0 1 10 0v4.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
        '<circle cx="16" cy="20.5" r="1.8" fill="currentColor"/>'
      ]);
    case "check":
      return svg([
        '<circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
        '<path d="M10.5 16.5l4 4 7.5-8.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "flag":
      return svg([
        '<path d="M8.5 27.5v-23" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
        '<path d="M8.5 6h15l-3.8 4.5 3.8 4.5h-15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'
      ]);
    case "shield":
      return svg([
        '<path d="M16 4l10 3.8v7.4c0 6.8-4.4 10.8-10 12.8-5.6-2-10-6-10-12.8V7.8L16 4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
        '<path d="M11.5 15.5l3.2 3.2 6-6.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "megaphone":
      return svg([
        '<path d="M25.5 5.5l-12 4.8H9a3.6 3.6 0 0 0-3.6 3.6v.2A3.6 3.6 0 0 0 9 17.7h4.5l12 4.8v-17z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
        '<path d="M12.5 17.7l1.5 7.3a2 2 0 0 0 2 1.6h.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'
      ]);
    case "trend-up":
      return svg([
        '<path d="M5 24l8.5-8.5 5 5L27 12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
        '<path d="M19.5 11h8v8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "trend-down":
      return svg([
        '<path d="M5 8l8.5 8.5 5-5L27 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
        '<path d="M19.5 21h8v-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    case "trend-flat":
      return svg([
        '<path d="M5 16h22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
        '<path d="M21.5 10.5L27 16l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
      ]);
    default:
      throw new Error("Unknown icon: " + kind);
  }
}
