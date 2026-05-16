# Riff — Architecture & Project Reference

**Last Updated**: May 9, 2026

This file is the single source of truth for project context. The `/letsriff` slash command reads this automatically at the start of each session.

---

## What is Riff?

A private essay-sharing platform for creative communities. Users create **clubs** (groups), launch **riffs** (writing prompts with deadlines), write essays, and read + comment on each other's work after a reveal.

**Tech Stack**: Next.js 16 (React 19) · TypeScript · Prisma · PostgreSQL (Supabase) · Tiptap · Tailwind CSS · NextAuth.js · Resend

---

## Current State (May 9, 2026)

### What's Working
- Landing page + About page
- Magic link authentication (Resend)
- Full onboarding flow (name → club → no-club holding page)
- Club detail page with riff cards, completed riffs
- Riff lifecycle: DRAFT → ACTIVE → REVEALED → COMPLETED (with confetti)
- Read page with Tiptap read-only rendering, comment toggle, hide-on-scroll mobile nav
- Comment system with text selection anchoring, bidirectional sidebar positioning, inline compose
- Rich text editor (Tiptap: resizable images, YouTube, Spotify embeds)
- Write page with white canvas, floating toolbar, subtitle, keyboard-aware mobile toolbar
- Draft editor with autosave (content, title, subtitle, cover image) and HEIC support
- Profile page redesign (featured piece hero, piece grid, My Stats modal, piece management)
- Settings page redesign (edit profile with avatar crop, docx export, delete account)
- Notification system (bell + panel, polls every 30s, click-through routing)
- Notification emails (riff created, riff revealed, daily comment digest via Resend + Vercel Cron)
- Mandatory riff deadlines with live day countdown
- Redesigned navbar, club dropdown, and sign-in email
- Avatar system with admin badges
- Paste-to-insert (images auto-upload, YouTube auto-embed, Spotify confirm modal)
- Founders note about page with fake comment highlights
- Mobile commenting with keyboard-aware compose modal
- Mobile responsive across all views
- Image uploads via Supabase Storage (persistent across deploys)
- Public piece sharing — `/p/[pieceId]` for readers without club access
- Delete club (host-only, typed confirmation modal)
- Delete account (settings, typed confirmation)
- Docx export — single piece as .docx, multiple as .zip
- No-club landing page (`/no-club`) for logged-in users waiting on a club invite
- WhatsNext modal system (context-aware post-action prompts)
- Badge shared component (Public, New Comments, etc.)
- ThreeDotButton shared component (dark/light variants)
- DestructiveButton shared component

---

## File Map

### Pages
```
src/app/
├── page.tsx                   # Landing page
├── about/page.tsx             # About page
├── login/page.tsx             # Magic link login
├── auth/post-login/page.tsx   # Post-login routing (onboarding vs club)
├── settings/page.tsx          # User settings
├── clubs/[id]/page.tsx        # Club detail (main hub)
├── riffs/[id]/page.tsx        # Riff detail (revealed pieces)
├── read/[pieceId]/page.tsx    # Reading page (members)
├── p/[pieceId]/page.tsx       # Public reading page (non-members)
├── write/[pieceId]/page.tsx   # Draft editor
├── profile/[userId]/page.tsx  # User profile
├── no-club/page.tsx           # Holding page for users without a club
└── onboarding/                # Onboarding flow (name, club-choice, create-club, banner)
```

### API Routes
```
src/app/api/
├── auth/                      # NextAuth (magic link)
├── clubs/                     # Club CRUD + members + riffs + join + delete
├── riffs/[id]/                # Riff CRUD, participants, read tracking
├── drafts/                    # Draft creation
├── pieces/[id]/               # Piece CRUD, autosave, share/unshare, versions
├── pieces/[id]/shares/        # Public share management
├── comments/                  # List + create (with selection anchor)
├── notifications/             # List, mark read, unread count
├── cron/daily-comment-notifications/  # Vercel Cron — daily comment digest emails
├── users/me/                  # Current user, update, delete, export (docx/zip)
├── users/[id]/                # User profile data
└── upload/image/              # Image upload (auth required, 5MB max)
```

### Components
```
src/components/
├── shared/        # Modal, Avatar, AvatarStack, AdminBadge, EnvironmentBadge, Dropdown,
│                  # ImageUploadModal, ImageUploadFlow, ImageDropZone, WhatsNextModal,
│                  # Badge, ThreeDotButton
├── clubs/         # ClubPageLayout, NavBar, ClubDropdown, AvatarDropdown, ClubSettingsModal,
│                  # DeleteClubConfirmModal, ConversionModal
├── riffs/         # RiffCard, RiffCTAButton, RiffPageLayout, CreateRiffModal, EditRiffModal,
│                  # DeleteRiffConfirmModal, RevealCelebration, RevealConfirmModal, PieceCard,
│                  # CompletedRiffCard, ReadyToRevealCard, MosaicCollage, ProgressCard,
│                  # RiffFormFields, ContributionStrip, EmptyRiffState, CountdownTimer,
│                  # RevealRiffButton
├── read/          # ReadPageLayout, ReadOnlyEditor, ReadToggle, ReadingProgress,
│                  # CommentAnchor, CommentPopover, CommentSidebar, CommentModal,
│                  # CommentComposeModal, CommentButton
├── profile/       # ProfilePage, ProfileHeader, ProfileSection tabs, DeletePieceModal,
│                  # MyStatsModal, ShareModal
├── notifications/ # NotificationBell, NotificationPanel, NotificationItem
├── settings/      # SettingsPage, ProfileSection, DataSection, DeleteAccountConfirmModal
├── about/         # FoundersNotePage, FakeCommentHighlight
├── write/         # WritePage, CoverImageModal, SubmitConfirmModal, EmbedModal, MediaEmbedModal,
│                  # LinkPopover, ResizableImageView, toolbar/StickyToolbar, toolbar/ToolbarButton,
│                  # toolbar/toolbarButtons
├── editor/        # TiptapEditor, EditorToolbar, extensions/Spotify, extensions/sharedExtensions
├── PrimaryButton.tsx, SecondaryButton.tsx, CTAButton.tsx, DestructiveButton.tsx
└── TextInput.tsx, BackButton.tsx, CloseButton.tsx, NoiseBackground.tsx, Tagline.tsx
```

For the design system, shared component catalog, and UI patterns, see `DESIGN-SYSTEM.md`.

### Hooks & Lib
```
src/hooks/
├── useMediaQuery.ts           # SSR-safe media query + useIsMobile
├── useProfileNavigation.ts    # Navigate to /profile/[userId]
├── useDraftCreation.ts        # Create draft + navigate to write page
├── useTextSelection.ts        # Text selection detection
├── useThemeColor.ts           # Dynamically update iOS Safari status bar color
└── useScrollDirection.ts      # Hide-on-scroll detection for auto-hiding nav bars

src/lib/
├── prisma.ts                  # Prisma singleton
├── auth.ts                    # NextAuth config (Resend magic link)
├── auth-utils.ts              # requireAuth(), getSession(), getCurrentUser()
├── resend.ts                  # Email: signIn, onboarding, riff created, riff revealed, comment digest
├── riff-utils.ts              # Shared riff logic helpers (getSubmittedPieces, isPastDeadline, formatDateShort, etc.)
├── notifications.ts           # createNotification, notifyClubMembers, notifyRiffParticipants
├── tiptap-to-docx.ts          # Convert Tiptap JSON to .docx (used by export route)
├── whatsNextGuard.ts          # WhatsNext modal suppression logic
├── constants.ts               # Shared constants (club name/description max lengths)
├── timeAgo.ts                 # Relative time formatting (e.g., "3 days ago")
└── supabase.ts                # Supabase admin client (Storage uploads)
```

---

## Database Schema (Key Models)

```
Club         → has members (ClubMember), riffs (Riff), admin + moderator
ClubMember   → role: ADMIN | MODERATOR | MEMBER
Riff         → status: DRAFT | ACTIVE | REVEALED | COMPLETED, has participants, pieces
Piece        → title, content, coverImage, wordCount, versions
PieceVersion → frozen snapshot when shared
PieceRiff    → junction: piece submitted to riff
PieceRead    → tracks who read what in which riff (for reveal progress)
Share        → shareType: CLUB | RIFF | INDIVIDUAL | PUBLIC
Comment      → threaded, with selectionStart/End/selectedText anchoring
Notification → type: CLUB_INVITATION | RIFF_CREATED | RIFF_ACTIVATED | PIECES_REVEALED | NEW_COMMENT | ...
Jam          → short-form content posts (userId, content, note, url)
JamRead      → tracks who has read a jam
User         → email, username, firstName, lastName, bio, avatarUrl, onboardingStep
```

**Schema file**: `prisma/schema.prisma`

---

---

## Authentication

- **Provider**: Resend magic link (no passwords)
- **Session**: JWT (client-side)
- **Adapter**: PrismaAdapter
- **Protected routes**: Use `requireAuth()` from `@/lib/auth-utils`
- **Env vars**: Both `AUTH_SECRET` and `NEXTAUTH_SECRET` must be set (same value) — NextAuth v5 requires `AUTH_SECRET` for token verification

### Login flow
Email → magic link → NextAuth verifies token → `/auth/post-login` routes user:
- New user → `/onboarding/name`
- Returning user, onboarding incomplete → resume at their `onboardingStep`
- Returning user, onboarding complete → `/clubs/{lastActiveClubId}`

### Post-login routing
Handled by `/auth/post-login` server component (NOT the NextAuth `redirect` callback — calling `auth()` inside the callback causes infinite recursion and OOM crashes). Middleware (`src/middleware.ts`) protects routes by checking session cookie.

### Dev sign-in
`/dev-signin` page with test scenarios — sets `dev-user-email` cookie for instant user switching. `getSession()` checks this cookie before NextAuth (dev only, blocked in production).

---

## Multi-Developer Notes

### Shared Database
Everyone (local dev + staging) shares the `dev-riff` Supabase project. This means:
- You'll see other people's test data — that's fine
- **Schema changes need coordination** — message Kyle before modifying `prisma/schema.prisma`
- Only one person creates a migration at a time; others run `npm run db:migrate:dev` to apply

### Branch Strategy
```
feature/* or fix/*  →  develop  →  staging  →  main
```
- `develop`: integration branch (merge feature branches here via PR)
- `staging`: auto-deploys to staging.letsriff.app (password-protected)
- `main`: production (auto-deploys to letsriff.app)

### Image Uploads
- Stored in Supabase Storage (persistent across deploys)

---

## Migration Status

Transitioning from deprecated **Circle** architecture to **Club/Riff**:
- New: Club, ClubMember, Riff, RiffParticipant, Share
- Deprecated: Circle, CircleMember, CirclePrompt, PieceShare
- Old circle API routes still exist but all new features use Club/Riff
