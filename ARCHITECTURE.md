# Riff — Architecture & Project Reference

**Last Updated**: March 29, 2026

This file is the single source of truth for project context. The `/letsriff` slash command reads this automatically at the start of each session.

---

## What is Riff?

A private essay-sharing platform for creative communities. Users create **clubs** (groups), launch **riffs** (writing prompts with deadlines), write essays, and read + comment on each other's work after a reveal.

**Tech Stack**: Next.js 16 (React 19) · TypeScript · Prisma · PostgreSQL (Supabase) · Tiptap · Tailwind CSS · NextAuth.js · Resend

---

## Current State (March 29, 2026)

### What's Working
- Landing page + About page
- Magic link authentication (Resend)
- Full onboarding flow (name → club → banner → invite)
- Club detail page with onboarding checklist, riff cards, completed riffs
- Riff lifecycle: DRAFT → ACTIVE → REVEALED → COMPLETED (with confetti)
- Read page with Tiptap read-only rendering, comment toggle, hide-on-scroll mobile nav
- Comment system with text selection anchoring, bidirectional sidebar positioning, inline compose
- Rich text editor (Tiptap: resizable images, YouTube, Spotify embeds)
- Write page with white canvas, floating toolbar, subtitle, keyboard-aware mobile toolbar
- Draft editor with autosave (content, title, subtitle, cover image) and HEIC support
- Profile page (pieces, drafts, collections)
- Settings page (edit profile, export data, delete account)
- Notification system (bell + panel, polls every 30s)
- Club invitations (email, link, SMS)
- Avatar system with admin badges
- Mobile responsive across all views

### What's Incomplete
- Notification click-through (clicking doesn't navigate yet)
- Notification emails (in-app only, Resend templates not wired)
- Deadline reminder cron (planned, not implemented)
- Image persistence on Vercel (ephemeral filesystem — Supabase Storage migration planned)

---

## File Map

### Pages
```
src/app/
├── page.tsx                   # Landing page
├── about/page.tsx             # About page
├── login/page.tsx             # Magic link login
├── settings/page.tsx          # User settings
├── clubs/[id]/page.tsx        # Club detail (main hub)
├── riffs/[id]/page.tsx        # Riff detail (revealed pieces)
├── read/[pieceId]/page.tsx    # Reading page
├── write/[pieceId]/page.tsx   # Draft editor
├── profile/[userId]/page.tsx  # User profile
└── onboarding/                # Onboarding flow (name, club-choice, create-club, banner, invite)
```

### API Routes
```
src/app/api/
├── auth/                      # NextAuth (magic link)
├── clubs/                     # Club CRUD + members + riffs
├── riffs/[id]/                # Riff CRUD, participants, read tracking
├── drafts/                    # Draft creation
├── pieces/[id]/               # Piece CRUD, autosave, share/unshare, versions
├── comments/                  # List + create (with selection anchor)
├── notifications/             # List, mark read, unread count
├── users/me/                  # Current user, update, delete, export
├── users/[id]/                # User profile data
└── upload/image/              # Image upload (auth required, 5MB max)
```

### Components
```
src/components/
├── shared/        # Modal, Avatar, AvatarStack, AdminBadge, EnvironmentBadge, Dropdown, ImageUploadModal
├── clubs/         # ClubPageLayout, NavBar, ClubDropdown, AvatarDropdown, OnboardingChecklist, InviteOptions, ClubSettingsModal, JoinClubClient
├── riffs/         # RiffCard, RiffCTAButton, RiffPageLayout, CreateRiffModal, EditRiffModal,
│                  # DeleteRiffConfirmModal, RevealCelebration, RevealConfirmModal, PieceCard,
│                  # CompletedRiffCard, ReadyToRevealCard, MosaicCollage, PromptLibrary,
│                  # EmptyRiffState, CountdownTimer
├── read/          # ReadPageLayout, ReadOnlyEditor, ReadToggle, ReadingProgress,
│                  # CommentAnchor, CommentPopover, CommentSidebar, CommentDrawer
├── notifications/ # NotificationBell, NotificationPanel, NotificationItem
├── settings/      # SettingsPage, ProfileSection, DataSection
├── about/         # AboutPage
├── write/         # WritePage, CoverImageModal, ShareConfirmModal, ResizableImageView,
│                  # toolbar/StickyToolbar, toolbar/ToolbarButton, toolbar/toolbarButtons
└── editor/        # TiptapEditor, EditorToolbar, extensions/Spotify, extensions/sharedExtensions
```

### Reusable Component Catalog

**IMPORTANT: Always reuse these components before building anything new.**

#### Core UI (`src/components/`)
| Component | File | Use for |
|-----------|------|---------|
| **PrimaryButton** | `PrimaryButton.tsx` | Primary actions (green, neo-brutalist). Props: `loading`, `disabled` |
| **SecondaryButton** | `SecondaryButton.tsx` | Secondary actions (cyan). Same props as PrimaryButton |
| **TextInput** | `TextInput.tsx` | All form inputs. Props: `error`, `multiline`, `rows` |
| **BackButton** | `BackButton.tsx` | Back navigation. Props: `href`, `onClick`, `size` |
| **CloseButton** | `CloseButton.tsx` | Close/dismiss actions. Props: `onClick`, `size` |
| **IconButton** | `IconButton.tsx` | Generic icon button with 44px min tap target. Props: `src`, `label`, `onClick`, `size` |
| **NoiseBackground** | `NoiseBackground.tsx` | Fractal noise SVG backdrop. Props: `fillMode` |
| **Tagline** | `Tagline.tsx` | Colored vector highlight text. Props: `text`, `color` |
| **WelcomeNote** | `WelcomeNote.tsx` | Handwriting-font message box |

#### Shared (`src/components/shared/`)
| Component | File | Use for |
|-----------|------|---------|
| **Modal** | `Modal.tsx` | All modals/dialogs. Props: `isOpen`, `onClose`, `title`, `size` ("sm"\|"md"\|"lg"), `footer` |
| **Avatar** | `Avatar.tsx` | User avatars everywhere. Props: `user`, `size` (24\|32\|40\|48), `badge` ("admin"\|"moderator") |
| **AvatarStack** | `AvatarStack.tsx` | Overlapping avatar groups. Props: `users`, `size`, `onAvatarClick` |
| **Dropdown** | `Dropdown.tsx` | All dropdown menus. Props: `trigger`, `items`, `align` ("left"\|"right") |
| **ImageUploadModal** | `ImageUploadModal.tsx` | **Go-to modal for all image uploads.** Crop, drag-drop, HEIC/GIF support. Props: `isOpen`, `onClose`, `onSelect`, `title`, `aspectRatio` (16/9 for covers, 1 for avatars), `cropShape` ("rect"\|"round"), `currentImage`, `existingImages` |
| **AdminBadge** | `AdminBadge.tsx` | Host/moderator role indicator. Props: `type`, `size` |
| **EnvironmentBadge** | `EnvironmentBadge.tsx` | Dev/staging/prod label |

#### Onboarding (`src/components/onboarding/`)
| Component | File | Use for |
|-----------|------|---------|
| **ImageUpload** | `ImageUpload.tsx` | Drag-and-drop image upload with preview. Props: `onUpload`, `currentImage` |
| **OnboardingCard** | `OnboardingCard.tsx` | Full-screen onboarding layout. Props: `showLogo`, `headerContent` |
| **OnboardingProgress** | `OnboardingProgress.tsx` | Step dots. Props: `currentStep`, `totalSteps` |

#### Auth (`src/components/auth/`)
| Component | File | Use for |
|-----------|------|---------|
| **AuthCard** | `AuthCard.tsx` | Full-screen auth layout with noise background and logo |

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
├── resend.ts                  # Email: signIn, onboarding, club invite
├── notifications.ts           # createNotification, notifyClubMembers, notifyRiffParticipants
└── prompt-suggestions.ts      # 27 curated writing prompts
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
Notification → type: CLUB_INVITATION | RIFF_CREATED | RIFF_ACTIVATED | PIECES_REVEALED | NEW_COMMENT
User         → email, username, firstName, lastName, bio, avatarUrl, onboardingStep
```

**Schema file**: `prisma/schema.prisma`

---

## Design System

### Colors
- Primary: `#00FF66` (green) · Secondary: `#01EFFC` (cyan)
- Yellow: `#EECF01` · Orange: `#FF6B35` · Pink: `#C01582` · Purple: `#955CB5`

### Typography
- Body: DM Sans (`--font-dm-sans`)
- Handwriting: Over the Rainbow (`--font-over-the-rainbow`)
- Serif display: Playfair Display (`--font-playfair`) — navbar wordmark
- Hero: DM Serif Text (`--font-dm-serif-text`) — landing page 96px

### Component Patterns
- **PrimaryButton**: Green bg, white hover with green shadow
- **Modal**: 2px border, 8px shadow, white bg, focus trap, ESC close
- **Dropdown**: 2px black border, 4px hard black shadow, white bg, ESC/click-outside close. Items: action (with optional icon, active state), divider. Supports controlled and uncontrolled modes.
- **CTA layout**: Row on desktop (text left, button right), column on mobile (text top, button full-width)

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
- Stored locally in `public/uploads/images/` (ephemeral on Vercel)
- Images work in local dev but may disappear on staging between deploys
- Supabase Storage migration planned

---

## Migration Status

Transitioning from deprecated **Circle** architecture to **Club/Riff**:
- New: Club, ClubMember, Riff, RiffParticipant, Share
- Deprecated: Circle, CircleMember, CirclePrompt, PieceShare
- Old circle API routes still exist but all new features use Club/Riff
