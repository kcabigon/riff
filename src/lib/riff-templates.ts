export interface RiffTemplate {
  id: string;
  category: string;
  title: string;
  prompt: string;
}

export const RIFF_TEMPLATES: RiffTemplate[] = [
  {
    id: "liner-notes",
    category: "Music riff!",
    title: "Liner Notes",
    prompt:
      "Share a story that involves music. Whatever moves you or makes you move.",
  },
  {
    id: "culture-curated",
    category: "Culture riff!",
    title: "Culture, Curated",
    prompt:
      "Share something you created, consumed, or experienced this year that you're really feeling.",
  },
  {
    id: "stories-worth-telling",
    category: "Story riff!",
    title: "Stories Worth Telling",
    prompt:
      "The story you always tell, or the one you've never told. Take us on a narrative journey.",
  },
  {
    id: "field-notes",
    category: "Passion riff!",
    title: "Field Notes",
    prompt:
      "Share what you care about, or know really well. Whatever you're into, get us into it too.",
  },
  {
    id: "pictures-worth-1000-words",
    category: "Photo riff!",
    title: "Pictures Worth 1000 Words",
    prompt:
      "Dig up a photo, old, new, or maybe a few. Tell us the story behind it.",
  },
  {
    id: "somewhere-anywhere",
    category: "Places riff!",
    title: "Somewhere, Anywhere",
    prompt: "Write about someplace special. Take us there.",
  },
];
