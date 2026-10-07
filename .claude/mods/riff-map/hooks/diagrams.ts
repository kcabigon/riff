// Hand-drawn diagrams. Unlike the file lists, these don't update themselves:
// each one names the code it was checked against, so it can be re-checked
// when that code changes.
//
// The balance: each box has a plain title, then the real names underneath
// (files, functions, tables, API routes), so a newer coder learns where
// things live without a wall of jargon. Keep lines under ~56 columns.

export const INTRO =
  'Riff is a Next.js website. **Screens** show you things, **API routes** save your changes, and a **database** remembers everything.'

// Checked against src/app/**/page.tsx: almost every page reads with Prisma
// on the server; the API routes are mostly for changes from the browser.
export const SYSTEM_DIAGRAM = `┌──────────────────────┐ fetch  ┌──────────────────────┐
│ Screens              │ /api/… │ API routes           │
│ src/app/**/page.tsx  │ ─────▶ │ src/app/api/**       │
│ + src/components     │to save │ requireAuth() first  │
└──────────┬───────────┘        └──────────┬───────────┘
           │ reads (Prisma)                │ writes (Prisma)
┌──────────▼───────────────────────────────▼───────────┐
│ Database · PostgreSQL on Supabase                    │
│ User · Club · Riff · Piece · Comment · Notification  │
└──────────────────────────────────────────────────────┘`

export const SYSTEM_CAPTION =
  'Pages load their data on the server, straight from the database. When you change something, the screen calls an API route, which checks you are signed in and then saves. Emails go out through **Resend**, images live in **Supabase Storage**, and **Vercel** hosts the site.'

export const GLOSSARY = `**Words to know**
- **Database**: where everything is saved. Riff uses PostgreSQL, hosted on Supabase.
- **Prisma**: how our code reads and writes the database. \`prisma/schema.prisma\` lists every table.
- **API route**: a URL a screen calls to change something, like \`PATCH /api/riffs/123\`. They live in \`src/app/api\`.
- **Function**: a named piece of code you can call, like \`revealRiff()\`. Shared ones live in \`src/lib\`.
- **Component**: a reusable piece of a screen, like a button or a modal. They live in \`src/components\`.`

// Checked against app/login, lib/auth.ts, app/auth/post-login/page.tsx
export const LOGIN_DIAGRAM = `┌──────────────────────┐   ┌──────────────────────┐
│ Type your email      │ ▶ │ Magic link email     │
│ /login               │   │ sent by Resend       │
└──────────────────────┘   └──────────┬───────────┘
                                      │ click it
┌──────────────────────┐   ┌──────────▼───────────┐
│ /home, or            │ ◀ │ NextAuth signs you   │
│ /onboarding/name     │   │ in, then             │
│ if you're new        │   │ /auth/post-login     │
└──────────────────────┘   └──────────────────────┘`

export const LOGIN_CAPTION =
  'No passwords. Every API route calls `requireAuth()` (`src/lib/auth-utils.ts`) to check who you are.'

// Checked against prisma/schema.prisma
export const DATA_DIAGRAM = `┌──────────────┐  joins via   ┌──────────────┐
│ User         │  ClubMember  │ Club         │
│ a person     │ ───────────▶ │ a group      │
└──────┬───────┘  (role)      └──────┬───────┘
       │ writes                      │ has many
┌──────▼───────┐  PieceRiff   ┌──────▼───────┐
│ Piece        │ ───────────▶ │ Riff         │
│ title,       │ (submittedAt)│ prompt,      │
│ content      │              │ deadline,    │
└──────┬───────┘              │ status       │
       │ has many             └──────────────┘
┌──────▼───────┐
│ Comment      │
│ on a quote   │
└──────────────┘`

export const DATA_CAPTION =
  "Each box is a **table** in the database. **ClubMember** and **PieceRiff** are join tables: they link two things and hold details about the link, like your role in a club or when you submitted. A riff with no club (`Riff.clubId` empty) is an **open riff**."

export interface Flow {
  id: string
  label: string
  caption: string
  source: string
  diagram: string
}

export const FLOWS: Flow[] = [
  {
    id: 'riff',
    label: 'Life of a riff',
    caption:
      "These words are the riff's `status` in the database. Revealing goes through `revealRiff()` in `src/lib/reveal-riff.ts`, called by the host's Reveal button or by the daily job, and needs at least one submitted piece. A fourth status, COMPLETED, exists but nothing sets it yet.",
    source: 'api/riffs/[id]/route.ts (PATCH), lib/reveal-riff.ts, lib/club-cadence.ts',
    diagram: `┌────────────┐   ┌────────────┐   ┌────────────┐
│ DRAFT      │ ▶ │ ACTIVE     │ ▶ │ REVEALED   │
│ being set  │   │ writing    │   │ everyone   │
│ up         │   │ until the  │   │ can read   │
│            │   │ deadline   │   │            │
└────────────┘   └─────┬──────┘   └────────────┘
                       │ deadline passed, no pieces
                 ┌─────▼──────────────┐
                 │ 7-day grace, then  │
                 │ club is PAUSED and │
                 │ the riff deleted   │
                 └────────────────────┘`,
  },
  {
    id: 'piece',
    label: 'Life of a piece',
    caption:
      'A piece is one row in the **Piece** table. Being in a riff is a separate **PieceRiff** row, and its `submittedAt` stays empty until you press Submit.',
    source: 'components/write/WritePage.tsx, api/riffs/[id]/pieces/[pieceId], api/pieces/[id]/publish',
    diagram: `┌──────────────────────┐   ┌──────────────────────┐
│ Draft                │ ▶ │ Submit to a riff     │
│ WritePage autosaves  │   │ PATCH /api/riffs/    │
│ via /api/pieces/     │   │ [id]/pieces/[pieceId]│
│ [id]/autosave        │   │ sets submittedAt     │
└──────────┬───────────┘   └──────────────────────┘
           │ or, with no riff
┌──────────▼───────────┐
│ Publish on its own   │
│ /api/pieces/[id]/    │
│ publish sets         │
│ publishedAt          │
└──────────────────────┘`,
  },
  {
    id: 'access',
    label: 'Who can read what',
    caption:
      'The check runs on the server in `src/app/read/[pieceId]/page.tsx`, and anyone else is sent back home. "Friend" comes from `isFriendOf()` in `src/lib/friends.ts`: clubmates, riffmates, or someone who joined through one of your pieces.',
    source: 'app/read/[pieceId]/page.tsx, lib/friends.ts',
    diagram: `┌──────────────────────┐   ┌──────────────────────┐
│ In a REVEALED riff   │ ▶ │ club members, riff   │
│ (via PieceRiff)      │   │ participants, the    │
│                      │   │ author, friends      │
└──────────────────────┘   └──────────────────────┘
┌──────────────────────┐   ┌──────────────────────┐
│ Published on its own │ ▶ │ the author and       │
│ (publishedAt set)    │   │ their friends        │
└──────────────────────┘   └──────────────────────┘
┌──────────────────────┐   ┌──────────────────────┐
│ Public link          │ ▶ │ anyone, read-only,   │
│ /p/[pieceId]         │   │ no comments          │
└──────────────────────┘   └──────────────────────┘`,
  },
  {
    id: 'daily',
    label: 'Every morning',
    caption:
      "Vercel runs this once a day on its own. Freestyle clubs are skipped, because their host starts riffs by hand. Don't run it yourself: local development shares the team's database, so it would email real people.",
    source: 'vercel.json, api/cron/daily-notifications, lib/club-cadence.ts (decideForClub)',
    diagram: `      ┌───────────────────────────────────────┐
      │ Vercel Cron · every day at 13:00 UTC  │
      │ calls /api/cron/daily-notifications   │
      └───────────────────┬───────────────────┘
                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Comment digest       │   │ Reminders            │
│ one email a day      │   │ "keep writing" and   │
│ comment-             │   │ "go read" emails     │
│ notifications.ts     │   │ *-reminders.ts       │
└──────────────────────┘   └──────────────────────┘
┌──────────────────────┐   ┌──────────────────────┐
│ Cadence sweep        │ ▶ │ One action per club  │
│ club-cadence.ts      │   │ reveal · grace week  │
│ decideForClub()      │   │ · pause · start the  │
│                      │   │ next riff            │
└──────────────────────┘   └──────────────────────┘`,
  },
  {
    id: 'notify',
    label: 'Notifications',
    caption:
      '`notifyClubMembers()` and `notifyRiffParticipants()` send to a whole group at once. Emails only go to people who turned them on in their account settings. See every email at `/dev/emails` when running locally.',
    source: 'lib/notifications.ts, lib/resend.ts, components/notifications/NotificationBell.tsx',
    diagram: `          ┌────────────────────────────────┐
          │ Something happens in an API    │
          │ route, like a piece submitted  │
          └───────────────┬────────────────┘
            ┌─────────────┴──────────────┐
┌───────────▼──────────┐   ┌─────────────▼────────┐
│ In-app bell          │   │ Email                │
│ createNotification() │   │ build…Email() in     │
│ → Notification table │   │ src/lib/resend.ts,   │
│ bell checks every 30s│   │ sent by Resend       │
└──────────────────────┘   └──────────────────────┘`,
  },
]

// A picture at the top of each part of the app
export const AREA_DIAGRAMS: Record<string, string> = {
  home: `┌──────────────────────┐   ┌──────────────────────┐
│ /home                │ ▶ │ MyRiffsClient        │
│ page.tsx loads data  │   │ current riffs ·      │
│ via lib/home-data.ts │   │ drafts · pieces ·    │
│                      │   │ past riffs · friends │
└──────────────────────┘   └──────────────────────┘`,

  clubs: `┌──────────────────────┐   ┌──────────────────────┐
│ Club page            │ ▶ │ API /api/clubs/[id]  │
│ /clubs/[id]          │   │ settings, members,   │
│ ClubPageLayout       │   │ assign-cohost,       │
│                      │   │ transfer-admin       │
└──────────────────────┘   └──────────┬───────────┘
                                      ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Daily cadence sweep  │ ▶ │ Database             │
│ starts the next riff │   │ Club · ClubMember    │
│ on schedule          │   │ (ADMIN = host,       │
│                      │   │ MODERATOR = co-host) │
└──────────────────────┘   └──────────────────────┘`,

  riffs: `┌──────────────────────┐   ┌──────────────────────┐
│ Riff page            │ ▶ │ Reveal button        │
│ /riffs/[id]          │   │ PATCH /api/riffs/[id]│
│ RiffPageLayout       │   │ status: "REVEALED"   │
└──────────────────────┘   └──────────┬───────────┘
                                      ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Daily job, at the    │ ▶ │ revealRiff()         │
│ deadline             │   │ lib/reveal-riff.ts   │
│                      │   │ sets status + vol #, │
│                      │   │ notifies members     │
└──────────────────────┘   └──────────────────────┘`,

  writing: `┌──────────────────────┐   ┌──────────────────────┐
│ /write/[pieceId]     │ ▶ │ Autosave             │
│ WritePage, built on  │   │ /api/pieces/[id]/    │
│ the Tiptap editor    │   │ autosave, 0.5s after │
│                      │   │ you stop typing      │
└──────────┬───────────┘   └──────────────────────┘
           ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Submit to a riff     │   │ Publish on its own   │
│ sets PieceRiff       │   │ sets Piece           │
│ .submittedAt         │   │ .publishedAt         │
└──────────────────────┘   └──────────────────────┘`,

  reading: `┌──────────────────────┐   ┌──────────────────────┐
│ /read/[pieceId]      │ ▶ │ Highlight to comment │
│ checks who can read  │   │ /api/comments/create │
│ (How it works, c)    │   │ saves the quote and  │
│                      │   │ where it sits        │
└──────────┬───────────┘   └──────────────────────┘
           │ reach the end
┌──────────▼───────────┐
│ Marked as read       │
│ /api/riffs/[id]/read │
│ → PieceRead table    │
└──────────────────────┘`,

  friends: `┌──────────────────────┐   ┌──────────────────────┐
│ Who's a friend?      │   │ Share a piece        │
│ isFriendOf() in      │   │ public: /p/[id]      │
│ lib/friends.ts       │   │ email: /api/pieces/  │
│ clubmates, riffmates,│   │ [id]/send            │
│ piece invites        │   │ invite: /pieces/[id]/│
│                      │   │ join → friendship    │
└──────────────────────┘   └──────────────────────┘`,

  profile: `┌──────────────────────┐   ┌──────────────────────┐
│ /profile/[userId]    │   │ /account             │
│ ProfilePage          │   │ AccountPage          │
│ your pieces; hide    │   │ /api/users/me:       │
│ one via /api/pieces/ │   │ edit · export ·      │
│ [id]/profile-        │   │ delete               │
│ visibility           │   │                      │
└──────────────────────┘   └──────────────────────┘`,

  notifications: `┌──────────────────────┐   ┌──────────────────────┐
│ In-app bell          │   │ Email                │
│ lib/notifications.ts │   │ lib/resend.ts        │
│ → Notification table │   │ sent by Resend       │
│ NotificationBell     │   │ preview them all at  │
│ checks every 30s     │   │ /dev/emails          │
└──────────────────────┘   └──────────────────────┘`,

  auth: `┌──────────────────────┐   ┌──────────────────────┐
│ /login → magic link  │ ▶ │ /auth/post-login     │
│ NextAuth + Resend    │   │ new → /onboarding/   │
│ (lib/auth.ts)        │   │ name, else → /home   │
└──────────────────────┘   └──────────────────────┘
┌──────────────────────┐   ┌──────────────────────┐
│ Screens:             │   │ API routes:          │
│ middleware.ts needs  │   │ requireAuth() in     │
│ a session cookie     │   │ lib/auth-utils.ts    │
└──────────────────────┘   └──────────────────────┘`,
}
