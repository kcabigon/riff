export interface PromptSuggestion {
  id: string;
  category: string;
  text: string;
}

export const PROMPT_CATEGORIES = [
  "Reflections",
  "Letters",
  "Places",
  "Relationships",
  "Wild Cards",
] as const;

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  // Reflections
  { id: "r1", category: "Reflections", text: "Write about a moment that changed the way you see yourself." },
  { id: "r2", category: "Reflections", text: "What's a belief you held strongly five years ago that you've since abandoned?" },
  { id: "r3", category: "Reflections", text: "Describe the version of yourself you're most proud of — past, present, or future." },
  { id: "r4", category: "Reflections", text: "What's something you've never told anyone? Why not?" },
  { id: "r5", category: "Reflections", text: "Write about a time you were completely wrong." },
  { id: "r6", category: "Reflections", text: "What would you do differently if nobody was watching?" },

  // Letters
  { id: "l1", category: "Letters", text: "Write a letter to your 16-year-old self." },
  { id: "l2", category: "Letters", text: "Write a letter to someone you've lost touch with." },
  { id: "l3", category: "Letters", text: "Write a letter to the city or town that shaped you most." },
  { id: "l4", category: "Letters", text: "Write a thank-you letter to someone who doesn't know they changed your life." },
  { id: "l5", category: "Letters", text: "Write a letter to your future self, to be read in ten years." },

  // Places
  { id: "p1", category: "Places", text: "Describe a place you can never go back to." },
  { id: "p2", category: "Places", text: "Write about the first place that ever felt like home." },
  { id: "p3", category: "Places", text: "What does your current neighborhood smell like at 7am?" },
  { id: "p4", category: "Places", text: "Describe a room that holds a secret." },
  { id: "p5", category: "Places", text: "Write about getting lost — literally or metaphorically." },

  // Relationships
  { id: "re1", category: "Relationships", text: "Write about a friendship that ended without a fight." },
  { id: "re2", category: "Relationships", text: "Describe the last time you felt truly understood by someone." },
  { id: "re3", category: "Relationships", text: "Write about a meal that mattered." },
  { id: "re4", category: "Relationships", text: "What's the hardest conversation you've ever had?" },
  { id: "re5", category: "Relationships", text: "Write about someone you admire but have never told." },

  // Wild Cards
  { id: "w1", category: "Wild Cards", text: "Write about something you're obsessed with that nobody else cares about." },
  { id: "w2", category: "Wild Cards", text: "What's the most alive you've ever felt?" },
  { id: "w3", category: "Wild Cards", text: "Write about money. Be honest." },
  { id: "w4", category: "Wild Cards", text: "Describe the last dream you remember in vivid detail." },
  { id: "w5", category: "Wild Cards", text: "What would you create if you knew nobody would judge you?" },
  { id: "w6", category: "Wild Cards", text: "Write about a song that wrecks you every time." },
];
