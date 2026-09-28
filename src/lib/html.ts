// For text people typed, going into HTML — an email, most often. Names,
// titles and prompts can contain <, > or &, and must arrive as text, never as
// markup in someone else's inbox.
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
