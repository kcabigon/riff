export function extractPreview(html: string, maxChars = 160): string {
  const stripped = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length <= maxChars) return stripped;

  const cut = stripped.lastIndexOf(" ", maxChars);
  return stripped.slice(0, cut > 0 ? cut : maxChars) + "…";
}
