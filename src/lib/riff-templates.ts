export interface RiffTemplate {
  id: string;
  category: string;
  title: string;
  prompt: string;
}

export const RIFF_TEMPLATES: RiffTemplate[] = [
  {
    id: "lets-riff",
    category: "Open riff!",
    title: "Let's riff",
    prompt:
      "No rules, write whatever you want. This is what creative freedom feels like.",
  },
  {
    id: "liner-notes",
    category: "Music riff!",
    title: "Jam Session",
    prompt: "What's your jam? Share a story that involves music.",
  },
  {
    id: "somewhere-anywhere",
    category: "Places riff!",
    title: "Somewhere, Anywhere",
    prompt: "Write about someplace special. Take us there.",
  },
  {
    id: "geek-out",
    category: "Passion riff!",
    title: "Geek Out",
    prompt: "What's the thing you can't stop talking about? Now's your chance.",
  },
  {
    id: "pictures-worth-1000-words",
    category: "Photo riff!",
    title: "Polaroids",
    prompt:
      "Dig up a photo, old, new, or maybe a few. Develop the story behind it.",
  },
  {
    id: "life-updates",
    category: "Life riff!",
    title: "Life Updates",
    prompt: "Catch us up. The highlight reel, or the real stuff.",
  },
];
