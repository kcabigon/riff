import { Node, mergeAttributes } from '@tiptap/core';

export interface SpotifyOptions {
  addPasteHandler: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spotify: {
      setSpotifyEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

export const Spotify = Node.create<SpotifyOptions>({
  name: 'spotify',

  group: 'block',

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
        tag: 'div[data-spotify-embed] iframe',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = HTMLAttributes.src;

    return [
      'div',
      { 'data-spotify-embed': '', class: 'spotify-embed-wrapper' },
      [
        'iframe',
        mergeAttributes(
          this.options.HTMLAttributes,
          {
            src: embedUrl,
            style: 'border-radius:12px',
            width: '100%',
            height: '352',
            frameborder: '0',
            allowfullscreen: '',
            allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
            loading: 'lazy',
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
          // Convert regular Spotify URLs to embed URLs
          let embedUrl = options.src;

          // Handle different Spotify URL formats
          const trackMatch = options.src.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
          const albumMatch = options.src.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
          const playlistMatch = options.src.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);

          if (trackMatch) {
            embedUrl = `https://open.spotify.com/embed/track/${trackMatch[1]}`;
          } else if (albumMatch) {
            embedUrl = `https://open.spotify.com/embed/album/${albumMatch[1]}`;
          } else if (playlistMatch) {
            embedUrl = `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
          }

          return commands.insertContent({
            type: this.name,
            attrs: { src: embedUrl },
          });
        },
    };
  },

  addPasteHandler() {
    return {
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');

        if (!text || !this.options.addPasteHandler) {
          return false;
        }

        const spotifyRegex = /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
        const match = text.match(spotifyRegex);

        if (match) {
          this.editor.commands.setSpotifyEmbed({ src: text });
          return true;
        }

        return false;
      },
    };
  },
});
