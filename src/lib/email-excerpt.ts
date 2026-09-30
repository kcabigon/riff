import { Parser } from "htmlparser2";
import { escapeHtml } from "@/lib/html";

// The opening of a piece, for an email: its first `maxChars` characters of
// text, keeping only paragraphs, line breaks, bold and italic.
//
// Everything else is reduced to text or dropped. Other blocks — headings,
// quotes, list items — become plain paragraph breaks, so an opening like a
// "Chapter 1" heading still sits on its own line. Links become their text
// (no clickable links from someone's writing in an inbox), and images, embeds
// and media are dropped. All text is escaped, so nothing the author wrote can
// reach the email as markup.
//
// Returns the excerpt as email-ready HTML, one paragraph per line, plus each
// paragraph's plain text, for the inbox preview line.

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "li",
  "pre",
]);
const BOLD_TAGS = new Set(["strong", "b"]);
const ITALIC_TAGS = new Set(["em", "i"]);
// Content inside these never reaches the excerpt.
const SKIPPED_TAGS = new Set([
  "img",
  "figure",
  "iframe",
  "video",
  "audio",
  "script",
  "style",
  "svg",
]);

type Inline =
  | { kind: "text"; text: string }
  | { kind: "br" }
  | { kind: "open" | "close"; tag: "strong" | "em" };

export function buildEmailExcerpt(
  contentHtml: string,
  maxChars: number
): { html: string; paragraphs: string[] } {
  const paragraphs: Inline[][] = [];
  let current: Inline[] = [];
  let used = 0;
  // Characters kept in the paragraph being built, to spot a cut that would
  // leave only a stub of it.
  let paragraphUsed = 0;
  let done = false;
  let skipDepth = 0;

  const endParagraph = () => {
    if (current.some((t) => t.kind === "text" && t.text.trim())) {
      paragraphs.push(current);
    }
    current = [];
    paragraphUsed = 0;
  };

  const parser = new Parser(
    {
      onopentag(name) {
        if (done) return;
        if (SKIPPED_TAGS.has(name)) {
          skipDepth++;
          return;
        }
        if (skipDepth > 0) return;
        if (BLOCK_TAGS.has(name)) endParagraph();
        else if (name === "br") current.push({ kind: "br" });
        else if (BOLD_TAGS.has(name))
          current.push({ kind: "open", tag: "strong" });
        else if (ITALIC_TAGS.has(name))
          current.push({ kind: "open", tag: "em" });
      },
      ontext(raw) {
        if (done || skipDepth > 0) return;
        const text = raw.replace(/\s+/g, " ");
        if (!text.trim() && !current.length) return;
        const remaining = maxChars - used;
        if (text.length <= remaining) {
          current.push({ kind: "text", text });
          used += text.length;
          paragraphUsed += text.length;
          return;
        }
        // Over the limit: stop at the last whole word that fits.
        const cut = text.slice(0, remaining);
        const lastSpace = cut.lastIndexOf(" ");
        const kept = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(
          /[\s,;:.]+$/,
          ""
        );
        done = true;
        // A cut this early in a paragraph would leave a stub ("Twenty-five…"),
        // so end on the last whole paragraph instead — the email's "Keep
        // reading" button already says there's more.
        if (paragraphs.length > 0 && paragraphUsed + kept.length < 80) {
          current = [];
          return;
        }
        current.push({ kind: "text", text: `${kept}…` });
      },
      onclosetag(name) {
        if (SKIPPED_TAGS.has(name)) {
          skipDepth = Math.max(skipDepth - 1, 0);
          return;
        }
        if (done || skipDepth > 0) return;
        if (BLOCK_TAGS.has(name)) endParagraph();
        else if (BOLD_TAGS.has(name))
          current.push({ kind: "close", tag: "strong" });
        else if (ITALIC_TAGS.has(name))
          current.push({ kind: "close", tag: "em" });
      },
    },
    { decodeEntities: true }
  );
  parser.write(contentHtml);
  parser.end();
  endParagraph();

  const html = paragraphs
    .map((tokens) => {
      // Render with a stack so a paragraph cut mid-bold still closes cleanly,
      // and a stray close tag without its opener is ignored.
      const open: Array<"strong" | "em"> = [];
      let out = "";
      tokens.forEach((t, i) => {
        if (t.kind === "text") {
          out += escapeHtml(
            i === 0 || tokens[i - 1].kind === "br" ? t.text.trimStart() : t.text
          );
        } else if (t.kind === "br") {
          out += "<br>";
        } else if (t.kind === "open") {
          open.push(t.tag);
          out +=
            t.tag === "strong" ? '<strong style="font-weight:700;">' : "<em>";
        } else if (open.includes(t.tag)) {
          while (open.length) {
            const tag = open.pop()!;
            out += `</${tag}>`;
            if (tag === t.tag) break;
          }
        }
      });
      while (open.length) out += `</${open.pop()}>`;
      return out.trim();
    })
    .filter(Boolean);

  const paragraphText = paragraphs
    .map((tokens) =>
      tokens
        .map((t) => (t.kind === "text" ? t.text : t.kind === "br" ? " " : ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  return { html: html.join("\n"), paragraphs: paragraphText };
}
