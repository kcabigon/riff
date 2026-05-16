import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { Spotify } from "@/components/editor/extensions/Spotify";
import { Indent } from "@/components/editor/extensions/Indent";

/**
 * Shared Tiptap extensions used by both the write page (editable)
 * and the read page (read-only). Ensures pixel-perfect fidelity.
 *
 * Note: The write page extends Image with addNodeView() for resize handles.
 * The read page uses Image without resize since it's not editable.
 */
export function getSharedExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    // parseHTML recognizes <span data-link> — the write editor serializes links this way
    // so that tapping/clicking a link in edit mode never navigates (LinkPopover handles that).
    // The read page receives the same HTML from the DB so needs to parse it too.
    Link.extend({
      parseHTML() {
        return [
          ...(this.parent?.() ?? []),
          {
            tag: "span[data-link]",
            getAttrs: (node) => ({
              href: (node as HTMLElement).getAttribute("data-link"),
            }),
          },
        ];
      },
    }).configure({ openOnClick: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Underline,
    Image.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          width: {
            default: null,
            renderHTML: (attributes) => {
              if (!attributes.width) return {};
              return { style: `width: ${attributes.width}` };
            },
            parseHTML: (element) => element.style.width || null,
          },
          textAlign: {
            default: "center",
            renderHTML: (attributes) => {
              return { "data-align": attributes.textAlign };
            },
            parseHTML: (element) =>
              element.getAttribute("data-align") || "center",
          },
        };
      },
    }).configure({
      inline: false,
      allowBase64: false,
    }),
    Youtube.configure({
      controls: true,
      nocookie: true,
      inline: false,
      HTMLAttributes: { class: "youtube-video" },
    }),
    Spotify.configure({
      HTMLAttributes: { style: "border-radius:12px" },
    }),
    Indent,
  ];
}
