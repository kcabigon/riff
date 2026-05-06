import { Node, mergeAttributes, nodePasteRule } from "@tiptap/core";

export interface SpotifyOptions {
  addPasteHandler: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    spotify: {
      setSpotifyEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

function toSpotifyEmbedUrl(src: string): string {
  const trackMatch = src.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  const albumMatch = src.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  const playlistMatch = src.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);

  if (trackMatch)
    return `https://open.spotify.com/embed/track/${trackMatch[1]}`;
  if (albumMatch)
    return `https://open.spotify.com/embed/album/${albumMatch[1]}`;
  if (playlistMatch)
    return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
  return src;
}

export const Spotify = Node.create<SpotifyOptions>({
  name: "spotify",

  group: "block",

  atom: true,

  addOptions() {
    return {
      addPasteHandler: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-spotify-embed] iframe",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-spotify-embed": "", class: "spotify-embed-wrapper" },
      [
        "iframe",
        mergeAttributes(
          this.options.HTMLAttributes,
          {
            src: HTMLAttributes.src,
            style: "border-radius:12px",
            width: "100%",
            height: "352",
            frameborder: "0",
            allowfullscreen: "",
            allow:
              "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
            loading: "lazy",
          },
          HTMLAttributes
        ),
      ],
    ];
  },

  addCommands() {
    return {
      setSpotifyEmbed:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src: toSpotifyEmbedUrl(options.src) },
          });
        },
    };
  },

  addPasteRules() {
    if (!this.options.addPasteHandler) return [];
    return [
      nodePasteRule({
        find: /https?:\/\/open\.spotify\.com\/(track|album|playlist|episode|show)\/[a-zA-Z0-9]+(?:\?[^\s]*)?/g,
        type: this.type,
        getAttributes: (match) => ({
          src: toSpotifyEmbedUrl(match[0]),
        }),
      }),
    ];
  },
});
