# Riff — Architecture & Project Reference

**Last Updated**: September 15, 2026

This file is the single source of truth for project context. The `/letsriff` slash command reads this automatically at the start of each session. For the design system, shared component catalog, and UI patterns, see `DESIGN-SYSTEM.md`.

---

## What is Riff?

A private essay-sharing platform for creative communities. People write together in **riffs** (writing prompts with deadlines) — either inside a **club** (a standing group) or as an **open riff** with no club, joined by link. Pieces stay locked until the host reveals the riff, then everyone reads and comments. Writers can also **publish** pieces outside any riff and share them with **friends**.

**Tech Stack**: Next.js 16 (React 19, Turbopack) · TypeScript · Prisma 6 · PostgreSQL (Supabase) · Tiptap · Tailwind CSS · NextAuth.js · Resend · GSAP

---

## Current State (September 15, 2026)

### What's Working

**Home & navigation**
- `/home` (formerly `/my-riffs`) — unified feed: current riffs, joinable club riffs, ready-to-reveal, drafts, pieces, past riffs, friends row
- Global Create dropdown (New draft / New riff / New club), redesigned navbar, empty state for new users
- Landing page (detects logged-in users), About page (founder's note with fake comment highlights), Terms page

**Clubs**
- Club page with grid/slot progress cards, unified desktop/mobile header
- Join by link (`/clubs/[id]/join`), leave club, delete club (typed confirmation)
- Host roles: assign / re-assign / remove co-host, transfer host (emails both parties)
- Account deletion blocked for hosts with active club members

**Riffs**
- Lifecycle: DRAFT → ACTIVE → REVEALED → COMPLETED (reveal celebration)
- **Open (clubless) riffs** — created with no club, joined via invite link (`/riffs/[id]/join`)
- Riff page is one scrolling activity view: progress cards (locked until reveal), activity/comment feed, Read-by strip with progress rings
- Mandatory deadlines with countdown; editing a riff never silently moves the deadline
- Unified draft experience across riff + club pages (new draft vs attach existing draft)

**Writing & publishing**
- Write page: white canvas, floating/bubble toolbar, subtitle, keyboard-aware mobile toolbar, font picker
- Autosave (content, title, subtitle, cover), HEIC support, resizable images, YouTube/Spotify embeds, paste-to-insert
- Submit to a riff ("Cover + Submit"), or **publish riff-less** with an editable publish date ("Finish")

**Reading & comments**
- Read page (Tiptap read-only), reading metadata ("X min read • date"), prev/next piece navigation
- Text-selection-anchored comments with sidebar, popover, mobile compose modal, reply threads; comments stay anchored after edits
- Public read-only links (`/p/[pieceId]`)
- **Riff in motion (Beta)** — bespoke immersive WebGL/Web Audio reader, gated to one piece (see Experiments)

**Friends & sharing**
- Friends = clubmates, riffmates, or anyone who joined one of your pieces (see Access Model)
- Share modal: access level, copy/open public link, **Send** a piece to specific friends by email
- Invite friends through a piece (`/pieces/[id]/join`)

**Profile & account**
- Profile page: hero with avatar, bio, stats; piece grid; three-dot "Edit info"
- Account page (`/account`): edit profile + avatar crop, bio, email preferences (notifications + marketing), docx/zip export, delete account

**Notifications & email**
- In-app bell + panel (polls every 30s, click-through routing)
- Emails: magic link, riff created/revealed, member joined, piece submitted/shared, deadline changed/approaching, all pieces submitted, co-host/host transfer, daily comment digest, engagement reminders (remember-to-write, join-riff nudge)

**Internal**
- Admin analytics dashboard (`/admin`) — Kyle and Chris; leaderboard (`/leaderboard`) — Kyle only
- Release notes page (`/release-notes`) — built but hidden/unlinked

### Known Gaps / In Progress
- **Daily cron is a stopgap**: `/api/cron/daily-notifications` just runs the comment digest + engagement reminders back-to-back. The unified digest engine in `NOTIFICATIONS-PRD.md` is not started.
- **Engagement reminders**: a failed Resend send is still logged as sent, so that reminder is skipped until the next window.
- **Unused schema**: `Collection`, `CollectionPiece`, `CollectionCollaborator`, `Jam`, `JamRead`, `PieceVisibilitySettings`, and `ClubInvite` exist in the schema but no code queries them. Club joins use the link itself, not `ClubInvite` tokens.

---

## File Map

### Pages
```
src/app/
├── page.tsx                      # Landing page
├── about/                        # Founder's note
├── terms/                        # Terms of Service
├── login/                        # Magic link login
├── auth/post-login/              # Post-login routing (onboarding vs /home)
├── auth/check-email/, auth/error/
├── onboarding/                   # name, create-club, create-club-banner
├── home/                         # Unified feed (formerly /my-riffs)
├── clubs/[id]/                   # Club page
├── clubs/[id]/join/              # Join club by link (public)
├── riffs/[id]/                   # Riff page (activity view)
├── riffs/[id]/join/              # Join riff by link (public; open riffs)
├── pieces/[id]/join/             # Accept a friend invite via a piece
├── read/[pieceId]/               # Reading page (access-gated, see Access Model)
├── p/[pieceId]/                  # Public read-only page
├── write/[pieceId]/              # Draft editor
├── profile/[userId]/             # User profile
├── account/                      # Account settings
├── admin/, leaderboard/          # Admin: Kyle + Chris; leaderboard: Kyle only
├── release-notes/                # Hidden
└── dev-signin/, test-*/          # Dev-only sandboxes (not linked)
```

### API Routes
```
src/app/api/
├── auth/[...nextauth], auth/check-email
├── onboarding/name, onboarding/complete
├── clubs/                        # CRUD, members, riffs, join, stats
│   └── [id]/assign-cohost, [id]/transfer-admin
├── riffs/                        # POST creates an open (clubless) riff
│   └── [id]/                     # CRUD, participants, pieces, attach-draft, comments, read, mark-read
├── drafts/                       # Create draft (optionally attached to a riff)
├── pieces/                       # create, [id] CRUD, autosave, versions, shares
│   └── [id]/publish              # Publish a riff-less piece (sets publishedAt)
│   └── [id]/join                 # Accept piece invite → mutual friendship
│   └── [id]/send, send-candidates # Email a piece to chosen friends
├── comments/                     # list, create, [id]
├── notifications/                # list, [id] mark read, unread-count
├── cron/daily-notifications      # Vercel Cron (13:00 UTC): comment digest + engagement reminders
├── users/me/                     # current user, update, delete, export, email-preferences, admin-clubs
├── users/[id]/                   # public profile data
├── upload/image/                 # Image upload (auth required, 5MB max)
├── admin/stats, leaderboard      # Admin stats: Kyle + Chris; leaderboard: Kyle only
└── dev/set-user                  # Dev-only user switching
```

### Components
```
src/components/
├── shared/        # Modal, Avatar, AvatarStack, AdminBadge, Badge, Dropdown, ThreeDotButton, IconButton,
│                  # BackLink, SectionHeading, Toast, ShareLinkOptions, SendToFriendsModal, InvitePieceModal,
│                  # MobileCardCarousel, EnvironmentBadge, ImageUploadModal/Flow, ImageDropZone, icons
├── home/          # MyRiffsEmptyState
├── clubs/         # ClubPageLayout, NavBar, ClubDropdown, AvatarDropdown, CreateDropdown, CreatePillButton,
│                  # ClubSettingsModal, JoinClubClient, AssignCoHostModal, TransferHostModal,
│                  # LeaveClubConfirmModal, DeleteClubConfirmModal
├── riffs/         # RiffPageLayout, RiffEventCard, ProgressCard, PieceCard, CompletedRiffCard, ReadyToRevealCard,
│                  # ActivityFeed, ReadByStrip, FriendsRow, RiffCTAButton, RevealRiffButton, RevealConfirmModal,
│                  # RevealCelebration, CreateRiffModal, EditRiffModal, RiffFormFields, DeleteRiffConfirmModal,
│                  # DraftChoiceModal, DraftChoiceTrigger, InviteFriendModal, JoinRiffClient, MosaicCollage,
│                  # PublicShareIndicator, EmptyRiffState
├── pieces/        # ShareModal, PieceJoinClient, PieceViewer, PieceStatus, VersionTimeline
├── read/          # ReadPageLayout, ReadOnlyEditor, ReadToggle, ReadingProgress, PieceNavigation,
│                  # CommentAnchor, CommentButton, CommentPopover, CommentSidebar, CommentModal,
│                  # CommentComposeModal, ReplyThread, MotionExperienceCTA, StrangeCaseExperience
├── write/         # WritePage, DraftCard, PieceActionCTA, PieceConfirmModal, PublishConfirmModal,
│                  # SubmitConfirmModal, CoverImageModal, EmbedModal, MediaEmbedModal, LinkPopover,
│                  # ResizableImageView, toolbar/{StickyToolbar, ToolbarButton, toolbarButtons, FontControl}
├── editor/        # TiptapEditor, EditorToolbar
├── profile/       # ProfilePage, ProfileHeader, ShareModal, DeletePieceModal, tabs/PiecesGrid
├── account/       # AccountPage, ProfileSection, EmailSection, DataSection, DeleteAccountConfirmModal
├── notifications/ # NotificationBell, NotificationPanel, NotificationItem
├── onboarding/    # OnboardingCard, OnboardingInput, OnboardingTextarea, OnboardingProgress
├── auth/          # AuthCard, AuthInput
├── about/         # FoundersNotePage, FakeCommentHighlight, AboutCommentSidebar
├── admin/         # AdminDashboard, StatCard, RiffStatusBar
├── leaderboard/   # LeaderboardPage
├── whats-new/     # WhatsNewPage (release notes)
└── (top level)    # PrimaryButton, SecondaryButton, CTAButton, DestructiveButton, IconButton, TextInput,
                   # BackButton, CloseButton, NoiseBackground, Tagline, LandingClientPage, LandingNavBar, WelcomeNote
```

### Hooks & Lib
```
src/hooks/
├── useMediaQuery.ts           # SSR-safe media query + useIsMobile
├── useProfileNavigation.ts    # Navigate to /profile/[userId]
├── useDraftCreation.ts        # Create draft + navigate to write page
├── useRevealRiff.ts           # Reveal-riff request + state
├── useTextSelection.ts        # Text selection detection
├── useThemeColor.ts           # Update iOS Safari status bar color
└── useScrollDirection.ts      # Hide-on-scroll for auto-hiding nav bars

src/lib/
├── prisma.ts                  # Prisma singleton
├── auth.ts                    # NextAuth config (Resend magic link)
├── auth-utils.ts              # requireAuth(), getSession() (dev cookie override), getCurrentUser()
├── auth-redirect.ts           # Post-auth redirect helpers
├── env.ts                     # getBaseUrl() and environment helpers
├── friends.ts                 # friendOfWhere() / isFriendOf() — the Friends access relation
├── riff-utils.ts              # Riff helpers (submitted pieces, deadlines, display titles, date formatting)
├── notifications.ts           # createNotification, notifyClubMembers, notifyRiffParticipants
├── comment-notifications.ts   # Daily comment digest job
├── engagement-reminders.ts    # Deadline-approaching / remember-to-write / join-riff nudge job
├── resend.ts                  # All transactional email templates + batchNotificationsEnabled()
├── supabase.ts, upload-image.ts, convert-heic.ts, crop-image.ts, extract-first-image.ts
├── tiptap-to-docx.ts          # Tiptap JSON → .docx (export)
├── timeAgo.ts                 # Relative time formatting
└── constants.ts               # Shared constants (length limits, etc.)

src/middleware.ts              # Staging password gate + session-cookie protection for app routes
```

---

## Database Schema (Key Models)

```
User         → email, name/first/last, username, bio, avatarUrl, lastActiveClubId,
               onboardingStep, emailNotifications, emailMarketing
Club         → name, description, bannerImage, isArchived, adminId (host), moderatorId (co-host)
ClubMember   → role: ADMIN | MODERATOR | MEMBER
Riff         → clubId (NULLABLE — null = open riff), creatorId (host), title, prompt, deadline,
               status: DRAFT | ACTIVE | REVEALED | COMPLETED, volumeNumber
RiffParticipant → user joined a riff (joinedAt)
Piece        → title, subtitle, currentContent, coverImage, wordCount, readLengthMin,
               publishedAt (set when published outside a riff)
PieceVersion → frozen snapshot
PieceRiff    → piece attached to a riff; submittedAt null = attached draft
PieceRead    → who read which piece in which riff (reveal progress / read rings)
Share        → shareType: CLUB | RIFF | INDIVIDUAL | PUBLIC (INDIVIDUAL = accepted piece invite)
Comment      → threaded, anchored via selectionStart/End/selectedText
Notification → CLUB_INVITATION, CLUB_MEMBER_JOINED, RIFF_CREATED, RIFF_STARTED, RIFF_INVITATION,
               RIFF_PARTICIPANT_JOINED, RIFF_DEADLINE_APPROACHING, RIFF_DEADLINE_CHANGED,
               PIECE_SUBMITTED_TO_RIFF, ALL_PIECES_SUBMITTED, RIFF_COMPLETED, NEW_COMMENT,
               COMMENT_REPLY, … (+ legacy values kept for old rows)
```

`RIFF_DEADLINE_APPROACHING`, `RIFF_STARTED`, and `RIFF_INVITATION` rows are also written with `isRead: true` as the engagement-reminder send log — they never surface in the bell.

**Schema file**: `prisma/schema.prisma`

---

## Access Model

Who can read a piece on `/read/[pieceId]`:
- **Riff pieces** — the riff must be REVEALED, and the reader must be a club member, a riff participant, the author, or a friend of the author.
- **Published riff-less pieces** (`publishedAt` set) — the author or a friend of the author.
- **Public links** (`/p/[pieceId]`) — anyone with the link, read-only, no comments.

**Friend** (`src/lib/friends.ts`) = clubmate in a non-archived club, riffmate on any riff, or an accepted piece invite in either direction. Joining someone's piece grants mutual friendship with its author, not just access to that piece.

---

## Authentication

- **Provider**: Resend magic link (no passwords)
- **Session**: JWT · **Adapter**: PrismaAdapter
- **Protected routes**: Use `requireAuth()` from `@/lib/auth-utils`
- **Env vars**: Both `AUTH_SECRET` and `NEXTAUTH_SECRET` must be set (same value)

### Login flow
Email → magic link → NextAuth verifies token → `/auth/post-login`:
- Onboarding incomplete at `NAME` → `/onboarding/name`
- Otherwise → `/home` (`CLUB_CHOICE` / `INVITE` are dead steps from the old club-first onboarding and also route to `/home`)

Routing lives in the `/auth/post-login` server component, NOT the NextAuth `redirect` callback — calling `auth()` inside the callback causes infinite recursion and OOM crashes. `src/middleware.ts` gates staging behind `STAGING_PASSWORD` and requires a session cookie for app routes (`/home`, `/clubs`, `/riffs`, `/write`, `/read`, `/profile`, `/account`, `/onboarding`, `/admin`). `/clubs/[id]/join` and `/riffs/[id]/join` are carved out as public; `/pieces/*` and `/p/*` aren't in the protected list.

### Dev sign-in
`/dev-signin` sets a `dev-user-email` cookie for instant user switching. `getSession()` checks it before NextAuth (dev only, ignored in production).

---

## Crons & Email

- **One Vercel Cron** (`vercel.json`): `/api/cron/daily-notifications` at 13:00 UTC, authenticated with `CRON_SECRET`. It runs the comment digest and engagement reminders. Vercel Hobby allows 2 cron jobs, so one slot is free.
- Reminder emails respect `User.emailNotifications`; marketing respects `emailMarketing`.

---

## Experiments

- **Riff in motion (Beta)** — `MotionExperienceCTA` + `StrangeCaseExperience` (WebGL shaders, generative Web Audio, kinetic type). Gated in `src/app/read/[pieceId]/page.tsx` to a single production piece ID. Flip `EXPERIMENT_ENABLED` to remove it. It doesn't appear locally because that ID only exists in the production DB.

---

## Multi-Developer Notes

### Databases
- **Local dev + staging share one Supabase project.** You'll see everyone's test data. A reset wipes it for the whole team — never accept a Prisma reset prompt.
- **Production is a separate Supabase project.** Schema changes must be applied with `npm run db:migrate:prod` **before** promoting code that depends on them.
- Schema changes are coordinated through Kyle; only one person creates a migration at a time. Others run `npm run db:migrate:dev`.

### Branch Strategy
```
feature/* or fix/*  →  develop  →  staging  →  main
```
- `develop`: integration branch — **anyone can merge their own PR, no approval needed** (schema changes still go through Kyle)
- `staging`: deploys to staging.letsriff.app (password-protected) — Kyle promotes
- `main`: production (letsriff.app) — Kyle promotes via `/promote` or `/release`
- Keep docs changes (including this file) flowing through `develop`, not straight to `main`, so promotes don't conflict

### Images
Stored in Supabase Storage (persistent across deploys).

---

## Legacy

The old **Circle** architecture is removed (models, routes, and the `CIRCLE` collection type). Leftovers are harmless: legacy `NotificationType` values (`CIRCLE_INVITATION`, `NEW_PROMPT`, `PIECE_SUBMITTED`, `PIECES_VISIBLE`) and `PieceVisibility.CIRCLES_ONLY` stay for existing rows.
