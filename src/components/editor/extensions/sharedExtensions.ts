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
    Link.configure({ openOnClick: true }),
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
      allowBase64: true,
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
