# Riff — Master TODO

Last updated: March 30, 2026 (modal cleanup, reveal todos, notification todos)

---

## Immediate (before staging deploy)

### Landing Page
- [x] Nav bar: consolidate to single "About" link (remove "What is this?" / "Who built this?")
- [x] Nav bar: make mobile responsive (hamburger with mobile_menu.svg)
- [x] Hero assets need realignment (riff_lp.svg +28px, write_club_lp.svg +190px, 16px gaps, CTA 40px below "Start a")
- [ ] Hero section: mobile responsiveness

### About Page
- [x] Remove noise background — put text on white background so it's readable
- [x] Replace placeholder dashed-border boxes with actual photos
- [x] Fix heading font size for mobile (too large on small screens)
- [x] Show mobile-specific screenshot on small screens using `<picture>` element

### Onboarding
- [x] "Club name" field should auto-populate with first name (e.g. "Kyle's Club")
- [ ] Club photo: show visual preview by device
- [x] Club photo: "delete" button should be a trash icon
- [x] Redesign club-choice page to convert new users to hosts

### Club Page
- [x] Top-left logo should be icon only (not full wordmark) — uses riff_logo.svg
- [x] Redesign club dropdown
- [x] If club has banner photo: dark overlay + club details centered on photo in white text (dark scrim)
- [x] Club Settings gear icon: admin can edit club name, description, and banner image
- [x] Replace gear icon (⚙) with minimal three-dot SVG button with cyan hover effect
- [x] "Invite friends" should open a modal instead of navigating to onboarding
- [x] Public club join page at /clubs/[id]/join (no token needed — shareable link)
- [x] New user join onboarding flow (/onboarding/join) — name setup then joins club
- [x] Invite/join flow testing and improvements
- [x] Join page conversion modal ("what's a write club?" education flow)
- [x] When riff is revealed, remove from "Current Riff" section

### Riff Creation / Management
- [x] Volume number auto-assigned; riff name optional (not required to create)
- [x] Due date mandatory on riff creation, defaults to 1 month out, admin can edit later
- [x] Redesign prompts/inspiration UI
- [x] After creating a riff, host sees "Start writing" or "Invite friends" CTA
- [x] Don't show "Reveal pieces" until deadline passes OR all submissions are in

### Mobile Comments
- [ ] Redesign mobile comment experience — easy commenting and navigation between comments in "comment" mode

### Riff Card & Riff Page
- [x] Update riff card: simplified to "Joined by" + avatars
- [x] Design riff participant progress view on the riff page
- [x] Redesign PieceCard as book cover (4:5 portrait, full-bleed image, overlay title, author avatar)

### Riff Page
- [x] Redesign riff page layout
- [x] Change back button styling (shared BackButton component, used across all back navigation)
- [x] Share button: confirmation modal + PATCH submittedAt on PieceRiff + fix reveal submitted count

### Modal Design System
- [x] Audit and update Modal component — ensure noise background, tagline highlights, and CTA styling are consistent across all usages
- [x] Cover image modal: update to match Modal component (noise background, CTA style, border/shadow spec)
- [x] Share piece modal: update to match Modal component (noise background, CTA style, border/shadow spec)
- [x] Review all modals (RevealConfirmModal, EditRiffModal, DeleteRiffConfirmModal, ClubSettingsModal, CreateRiffModal, InviteOptions) and bring into alignment with updated Modal component

### Read / Write Experience
- [x] Write page redesign: white canvas, floating toolbar, subtitle, resizable images, hide-on-scroll mobile nav
- [x] Read page redesign: Tiptap read-only, shared extensions, bidirectional comment positioning
- [x] YouTube embeds, images, Spotify links mobile responsive
- [x] Cover image upload UI (CoverImageModal with upload, crop, piece image picker, HEIC support)
- [x] Cover image: update editor UI to show current cover image preview inline (e.g. thumbnail next to the "Cover image" button)
- [x] Cover image: test all three fallbacks end-to-end (explicit cover → first content image → placeholder color) with correct overlay + white title

### Profile Page
- [x] Change tab order to: Drafts, Pieces, Collections
- [ ] Drafts list not updating immediately after new piece is created
- [x] Add way to get back to club page from profile (BackButton using lastActiveClubId)
- [ ] Access control deep dive — profile pages (and likely other pages) are wide open to any logged-in user; audit and enforce correct visibility rules across the app
- [ ] Drafts tab visible to any logged-in user on someone else's profile — should be owner-only
- [ ] Profile banner image — reuse club banner upload component (ImageUploadModal)
- [ ] After PieceRiff schema migration (DRAFT/SUBMITTED status field): fix profile Pieces tab to only show pieces that are SUBMITTED + riff is REVEALED — prevents sneak peeks on other users' profiles

### Piece Management
- [x] Let users manage piece state: draft vs. published, shared in riff vs. not ready to share
- [x] Clear distinction between drafts (in progress), submitted pieces (shared to a riff), and personal pieces (not in a riff)

### Reveals
- [x] Improve reveal logic — review edge cases (partial submissions, timing, re-reveal prevention)
- [x] Add "Reveal early" option for hosts — allow manual reveal before deadline
- [x] Add "Delete riff" functionality — host can delete a riff before it's revealed

### Notifications
- [x] Notification bell uses SVG icon with unread count badge
- [x] Clicking a notification should navigate to the relevant page
- [ ] In-app notifications: full audit of triggers and copy (which events fire, what the message says)
- [ ] Email notifications: audit triggers, design emails, and write copy for all notification types

### Settings
- [x] Avatar upload and management

### Merge & Deploy
- [x] Merge `feature/polish-phase-1` to develop
- [x] Test full flow on Vercel (staging.letsriff.app deployed and working)

---

## Soon (post-staging, pre-launch)

- [x] Notification emails via Resend — riff created, pieces revealed
- [ ] Notification emails via Resend — deadline approaching, new comment
- [ ] Deadline reminder cron job (Vercel Cron, 24h before deadline)
- [ ] Toast notifications replacing `console.error` catches
- [ ] Loading skeletons for ClubPageLayout, ProfilePage, RiffPageLayout
- [ ] Deployment environment badge (dev/staging/production indicator)
- [x] Onboarding invite step now generates /clubs/[id]/join links instead of single-use tokens
- [x] Self-contained join page (email + name inline, no redirect to login/onboarding)
- [ ] Onboarding page refinements (create-club, join-club pages)

---

## Backlog (nice to have)

- [ ] Collections system (personal, group, circle)
- [ ] Multi-level sharing UI (CLUB, RIFF, INDIVIDUAL, PUBLIC)
- [ ] Permission helpers / reusable middleware
- [ ] Refactor editor: extract shared tiptap logic into `useRiffEditor` hook + unified `EditorToolbar`

---

## Tech Debt

- [ ] Fix tiptap Spotify `addPasteHandler` for v3.x API
- [ ] Update old circle routes for Next.js 16 async params (or deprecate)
- [ ] Upgrade Prisma from 6.1.0 to 7.3.0
