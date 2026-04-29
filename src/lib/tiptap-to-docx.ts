import path from "path";
import fs from "fs/promises";
import sizeOf from "image-size";
import { parseDocument } from "htmlparser2";
import { Element, Text, type ChildNode } from "domhandler";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  ExternalHyperlink,
  AlignmentType,
} from "docx";

// ─── HTML parsing helpers ────────────────────────────────────────────────────

function isElement(node: ChildNode): node is Element {
  return node.type === "tag";
}

function isText(node: ChildNode): node is Text {
  return node.type === "text";
}

function getAttr(el: Element, attr: string): string | undefined {
  return el.attribs?.[attr];
}

function getTextContent(node: ChildNode): string {
  if (isText(node)) return node.data;
  if (isElement(node)) return node.children.map(getTextContent).join("");
  return "";
}

function getAlignmentFromStyle(el: Element) {
  const style = getAttr(el, "style") ?? "";
  if (style.includes("text-align: center")) return AlignmentType.CENTER;
  if (style.includes("text-align: right")) return AlignmentType.RIGHT;
  if (style.includes("text-align: justify")) return AlignmentType.JUSTIFIED;
  return undefined;
}

// ─── Inline node → TextRun/ExternalHyperlink ────────────────────────────────

type InlineChild = TextRun | ExternalHyperlink;

interface TextStyle {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  strike?: boolean;
}

function inlineNodesToRuns(
  nodes: ChildNode[],
  style: TextStyle = {}
): InlineChild[] {
  return nodes.flatMap<InlineChild>((node) => {
    if (isText(node)) {
      if (!node.data) return [];
      return [
        new TextRun({
          text: node.data,
          bold: style.bold,
          italics: style.italics,
          strike: style.strike,
          underline: style.underline ? {} : undefined,
        }),
      ];
    }

    if (!isElement(node)) return [];

    switch (node.name) {
      case "strong":
      case "b":
        return inlineNodesToRuns(node.children, { ...style, bold: true });
      case "em":
      case "i":
        return inlineNodesToRuns(node.children, { ...style, italics: true });
      case "u":
        return inlineNodesToRuns(node.children, { ...style, underline: true });
      case "s":
      case "del":
        return inlineNodesToRuns(node.children, { ...style, strike: true });
      case "br":
        return [new TextRun({ break: 1 })];
      case "code":
        return [
          new TextRun({
            text: getTextContent(node),
            font: "Courier New",
            bold: style.bold,
          }),
        ];
      case "a": {
        const href = getAttr(node, "href");
        if (!href) return inlineNodesToRuns(node.children, style);
        const runs = inlineNodesToRuns(node.children, style);
        const textRuns = runs.filter((r): r is TextRun => r instanceof TextRun);
        if (!textRuns.length) return [];
        return [new ExternalHyperlink({ link: href, children: textRuns })];
      }
      default:
        return inlineNodesToRuns(node.children, style);
    }
  });
}

// ─── Image handling ──────────────────────────────────────────────────────────

async function resolveImage(src: string): Promise<
  | {
      data: Buffer;
      type: "jpg" | "png" | "gif";
    }
  | "webp"
  | null
> {
  try {
    const lower = src.toLowerCase();

    // Detect type from URL/mime type before fetching
    const isWebp = lower.includes(".webp") || src.startsWith("data:image/webp");
    if (isWebp) return "webp";

    const type =
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      src.startsWith("data:image/jpeg")
        ? "jpg"
        : lower.includes(".gif") || src.startsWith("data:image/gif")
          ? "gif"
          : "png";

    let data: Buffer;

    if (src.startsWith("data:")) {
      const base64 = src.split(",")[1];
      data = Buffer.from(base64, "base64");
    } else if (src.startsWith("http://") || src.startsWith("https://")) {
      const res = await fetch(src);
      if (!res.ok) return null;
      data = Buffer.from(await res.arrayBuffer());
    } else {
      // Local path fallback
      const filePath = path.join(process.cwd(), "public", src);
      data = await fs.readFile(filePath);
    }

    return { data, type };
  } catch {
    return null;
  }
}

// ─── Block element → Paragraph[] ────────────────────────────────────────────

async function blockElementToParagraphs(el: Element): Promise<Paragraph[]> {
  switch (el.name) {
    case "h1":
    case "h2":
    case "h3": {
      const level =
        el.name === "h1"
          ? HeadingLevel.HEADING_2
          : el.name === "h2"
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4;
      return [
        new Paragraph({
          heading: level,
          children: inlineNodesToRuns(el.children),
          alignment: getAlignmentFromStyle(el),
        }),
      ];
    }

    case "p": {
      const children = inlineNodesToRuns(el.children);
      return [
        new Paragraph({
          children: children.length ? children : [new TextRun("")],
          alignment: getAlignmentFromStyle(el),
          spacing: { after: 240 },
        }),
      ];
    }

    case "blockquote": {
      // Blockquote wraps <p> tags — flatten them with indent
      const results: Paragraph[] = [];
      for (const child of el.children) {
        if (isElement(child) && child.name === "p") {
          results.push(
            new Paragraph({
              children: inlineNodesToRuns(child.children),
              indent: { left: 720 },
              spacing: { after: 240 },
            })
          );
        }
      }
      return results;
    }

    case "ul": {
      return el.children
        .filter((c): c is Element => isElement(c) && c.name === "li")
        .map((li) => {
          // Tiptap wraps li content in <p>
          const inner = li.children.find(
            (c): c is Element => isElement(c) && c.name === "p"
          );
          return new Paragraph({
            bullet: { level: 0 },
            children: inlineNodesToRuns(inner ? inner.children : li.children),
          });
        });
    }

    case "ol": {
      return el.children
        .filter((c): c is Element => isElement(c) && c.name === "li")
        .map((li, i) => {
          const inner = li.children.find(
            (c): c is Element => isElement(c) && c.name === "p"
          );
          return new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. ` }),
              ...inlineNodesToRuns(inner ? inner.children : li.children),
            ],
          });
        });
    }

    case "pre": {
      const codeEl = el.children.find(
        (c): c is Element => isElement(c) && c.name === "code"
      );
      const text = getTextContent(codeEl ?? el);
      return [
        new Paragraph({
          children: [new TextRun({ text, font: "Courier New" })],
        }),
      ];
    }

    case "hr": {
      return [
        new Paragraph({
          children: [new TextRun({ text: "───────────────────────" })],
          alignment: AlignmentType.CENTER,
        }),
      ];
    }

    case "img": {
      const src = getAttr(el, "src");
      if (!src) return [];
      const resolved = await resolveImage(src);
      if (!resolved) {
        return [
          new Paragraph({
            children: [
              new TextRun({
                text: "[Image unavailable]",
                italics: true,
                color: "808080",
              }),
            ],
          }),
        ];
      }
      if (resolved === "webp") {
        return [
          new Paragraph({
            children: [
              new TextRun({
                text: "[Image: WebP format not supported in Word — view on Riff]",
                italics: true,
                color: "808080",
              }),
            ],
          }),
        ];
      }
      const maxWidth = 468;
      let displayWidth = maxWidth;
      let displayHeight = 300;
      try {
        const dims = sizeOf(resolved.data);
        if (dims.width && dims.height) {
          const scale = Math.min(1, maxWidth / dims.width);
          displayWidth = Math.round(dims.width * scale);
          displayHeight = Math.round(dims.height * scale);
        }
      } catch (err) {
        console.warn(
          "Could not read image dimensions, falling back to defaults:",
          err
        );
      }

      return [
        new Paragraph({
          children: [
            new ImageRun({
              data: resolved.data,
              transformation: { width: displayWidth, height: displayHeight },
              type: resolved.type,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ];
    }

    case "div": {
      // YouTube embed: <div data-youtube-video><iframe src="...">
      if ("data-youtube-video" in el.attribs) {
        const iframe = el.children.find(
          (c): c is Element => isElement(c) && c.name === "iframe"
        );
        const src = iframe ? getAttr(iframe, "src") : undefined;
        if (!src) return [];
        const videoId = src.match(/embed\/([a-zA-Z0-9_-]+)/)?.[1];
        const url = videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : src;
        return [
          new Paragraph({
            children: [
              new TextRun({ text: "YouTube: " }),
              new ExternalHyperlink({
                link: url,
                children: [new TextRun({ text: url, style: "Hyperlink" })],
              }),
            ],
          }),
        ];
      }

      // Spotify embed: <div data-spotify-embed><iframe src="...">
      if ("data-spotify-embed" in el.attribs) {
        const iframe = el.children.find(
          (c): c is Element => isElement(c) && c.name === "iframe"
        );
        const src = iframe ? getAttr(iframe, "src") : undefined;
        if (!src) return [];
        const url = src.replace("open.spotify.com/embed/", "open.spotify.com/");
        return [
          new Paragraph({
            children: [
              new TextRun({ text: "Spotify: " }),
              new ExternalHyperlink({
                link: url,
                children: [new TextRun({ text: url, style: "Hyperlink" })],
              }),
            ],
          }),
        ];
      }

      // Generic div — recurse into children
      return htmlToParagraphs(el.children);
    }

    default:
      return [];
  }
}

// ─── Top-level HTML → Paragraph[] ───────────────────────────────────────────

async function htmlToParagraphs(nodes: ChildNode[]): Promise<Paragraph[]> {
  const results: Paragraph[] = [];
  for (const node of nodes) {
    if (isElement(node)) {
      results.push(...(await blockElementToParagraphs(node)));
    }
  }
  return results;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function pieceToDocxBuffer(piece: {
  title: string;
  subtitle?: string | null;
  currentContent: string;
}): Promise<Buffer> {
  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(piece.title)],
    }),
  ];

  if (piece.subtitle) {
    headerParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: piece.subtitle, italics: true })],
        spacing: { after: 240 },
      })
    );
  }

  const doc$ = parseDocument(piece.currentContent || "");
  const bodyParagraphs = await htmlToParagraphs(doc$.children as ChildNode[]);

  const doc = new Document({
    sections: [{ children: [...headerParagraphs, ...bodyParagraphs] }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export function slugifyTitle(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return (base || `untitled-${index + 1}`) + ".docx";
}
