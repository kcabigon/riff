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

/**
 * Extracts all image URLs from Tiptap-generated HTML content.
 * Used by CoverImageModal to let users pick from images already in their piece.
 */
export function extractAllImages(htmlContent: string): string[] {
  if (!htmlContent) return [];

  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}
