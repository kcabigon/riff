/**
 * Extracts the first image URL from Tiptap-generated HTML content.
 * Used as a fallback for completed riff card mosaics when no explicit cover image exists.
 */
export function extractFirstImage(htmlContent: string): string | null {
  if (!htmlContent) return null;

  // Match the first <img> tag and extract its src attribute
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}
