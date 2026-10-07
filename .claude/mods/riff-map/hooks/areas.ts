// The parts of Riff the map can zoom into. File lists come from
// ARCHITECTURE.md at open time; this file only says which lines belong where.

export interface Area {
  id: string
  label: string
  // What this part of the app is, for someone who doesn't code
  blurb: string
  // Where the summary comes from: a bold group under "What's Working",
  // or a whole ## section
  summary: { working: string } | { section: string }
  // Picks this area's lines out of the Pages, API Routes and Hooks & Lib maps
  files: RegExp
  // Screens anyone can open without signing in, listed after the main ones
  publicPages?: RegExp
  // Under src/components, listed live: a whole folder ("home"), or one
  // component from another folder ("shared/SendToFriendsModal")
  components: string[]
  models: string[]
  // Words in a prompt that point at this area
  keywords: RegExp
}

export const AREAS: Area[] = [
  {
    id: 'home',
    label: 'Home & feed',
    blurb:
      'The first screen after you sign in. It shows your current riffs, drafts, pieces and friends, and has the Create button.',
    summary: { working: 'Home & navigation' },
    files: /\bhome\b|my-riffs|app\/page\.tsx|about|terms|release-notes|useCreationOverlay|quick-start/i,
    publicPages: /app\/page\.tsx|about|terms|release-notes/,
    components: [
      'home',
      // The navbar and its menus live in clubs/ but are app-wide
      'clubs/NavBar',
      'clubs/CreateDropdown',
      'clubs/ClubDropdown',
      'clubs/AvatarDropdown',
      // The Create menu's full-screen creation flows
      'riffs/CreateRiffOverlay',
      'clubs/CreateClubOverlay',
      'shared/HeroCardOverlay',
      'shared/OverlayStepHeader',
    ],
    models: [],
    keywords: /\b(home ?page|home|feed|nav ?bar|navigation|landing|create dropdown)\b/gi,
  },
  {
    id: 'clubs',
    label: 'Clubs',
    blurb:
      'A club is a group that writes together. It has a host, sometimes a co-host, and members. New riffs start on a schedule (weekly, monthly…), or whenever the host likes if the club is Freestyle.',
    summary: { working: 'Clubs' },
    files: /club|co-?host|transfer-admin|cadence/i,
    components: ['clubs'],
    models: ['Club', 'ClubMember'],
    keywords: /\b(clubs?|co-?hosts?|hosts?|club members?|cadence)\b/gi,
  },
  {
    id: 'riffs',
    label: 'Riffs',
    blurb:
      'A riff is a writing prompt with a deadline. Everyone writes, nobody can read anyone else\'s piece yet, and then the riff is revealed so everyone can read.',
    summary: { working: 'Riffs' },
    files: /riff|reveal|deadline|participant/i,
    components: ['riffs'],
    models: ['Riff', 'RiffParticipant', 'PieceRiff', 'PieceRead'],
    keywords: /\b(riffs?|reveal\w*|deadlines?|writing prompts?|open riffs?|participants?)\b/gi,
  },
  {
    id: 'writing',
    label: 'Writing',
    blurb:
      'The writing screen. It saves as you type. When you\'re done, you submit the piece to a riff or publish it on its own.',
    summary: { working: 'Writing & publishing' },
    files: /write|draft|pieces\/(?!\[id\]\/(join|send))|publish|autosave|upload|tiptap|editor|heic|image/i,
    components: ['write', 'editor'],
    models: ['Piece', 'PieceVersion'],
    keywords: /\b(writ\w*|drafts?|editor|tiptap|publish\w*|autosave|toolbar|pieces?|cover images?)\b/gi,
  },
  {
    id: 'reading',
    label: 'Reading & comments',
    blurb:
      'The reading screen. Highlight any sentence to comment on it, and reply to other people\'s comments.',
    summary: { working: 'Reading & comments' },
    files: /read|comment|\bp\/|public/i,
    components: ['read'],
    models: ['Comment', 'PieceRead'],
    keywords: /\b(reading|reader|read page|comments?|replies|reply|highlights?|annotations?)\b/gi,
  },
  {
    id: 'friends',
    label: 'Friends & sharing',
    blurb:
      'Friends are people you share a club or a riff with. You can share a piece with a link, by email, or with an invite.',
    summary: { working: 'Friends & sharing' },
    files: /friend|share|\bsend|invite|join/i,
    components: [
      'pieces',
      'profile/ShareModal',
      'shared/SendToFriendsModal',
      'shared/InvitePieceModal',
      'shared/ShareLinkOptions',
    ],
    models: ['Share'],
    keywords: /\b(friends?|friendships?|shar(e|es|ing)|invites?|send\w*)\b/gi,
  },
  {
    id: 'profile',
    label: 'Profile & account',
    blurb:
      'Your profile shows your pieces. Account settings let you change your name, photo and emails, download your writing, or delete your account.',
    summary: { working: 'Profile & account' },
    files: /profile|account|users\/|export|avatar/i,
    components: ['profile', 'account'],
    models: ['User', 'PieceVisibilitySettings'],
    keywords: /\b(profiles?|accounts?|avatars?|bio|export|settings page)\b/gi,
  },
  {
    id: 'notifications',
    label: 'Notifications & email',
    blurb:
      'The bell in the app, and the emails Riff sends. Each person chooses which emails they get.',
    summary: { working: 'Notifications & email' },
    files: /notif|(?<!check-)emails?|resend|cron|digest|reminder|club-cadence|names\.ts|html\.ts/i,
    components: ['notifications'],
    models: ['Notification'],
    keywords: /\b(notifications?|emails?|bell|cron|digest|reminders?|resend)\b/gi,
  },
  {
    id: 'auth',
    label: 'Auth & onboarding',
    blurb:
      'How people sign in: type your email, click the link Riff sends, and you\'re in. No passwords. New people pick a name first.',
    summary: { section: 'Authentication' },
    files: /auth|login|onboarding|middleware|sign-?in|set-user/i,
    components: ['auth', 'onboarding'],
    models: ['User'],
    keywords: /\b(auth\w*|log ?ins?|sign ?ins?|onboarding|magic links?|sessions?|middleware)\b/gi,
  },
]

// Asking to build, change or understand something, as opposed to a quick
// question or a command
const INTENT =
  /\b(build|add|implement|create|make|change|update|fix|refactor|redesign|rework|explore|understand|learn|work on|figure out|walk me through|show me|look at|dig into|how (does|do|is|are)|where (is|are|does|do))\b/i

export function findArea(text: string): Area | undefined {
  let best: Area | undefined
  let bestCount = 0
  for (const area of AREAS) {
    const count = text.match(area.keywords)?.length ?? 0
    if (count > bestCount) {
      best = area
      bestCount = count
    }
  }
  return best
}

export function wantsToExplore(text: string): boolean {
  return INTENT.test(text)
}

export function areaById(id: string): Area | undefined {
  const key = id.trim().toLowerCase()
  if (!key) return undefined
  return AREAS.find((a) => a.id === key || a.id.startsWith(key)) ?? findArea(key)
}
