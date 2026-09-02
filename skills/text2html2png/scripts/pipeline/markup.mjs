export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderRichText(value) {
  const source = String(value);
  let result = "";
  let cursor = 0;
  for (const match of source.matchAll(/<strong>([\s\S]*?)<\/strong>/gi)) {
    result += escapeHtml(source.slice(cursor, match.index));
    result += "<strong>" + escapeHtml(match[1]) + "</strong>";
    cursor = match.index + match[0].length;
  }
  return result + escapeHtml(source.slice(cursor));
}
