# Riff — Master TODO

Last updated: March 26, 2026 (Jarric claiming invite/join + riff improvements)

---

## Immediate (before staging deploy)

### Landing Page
- [x] Nav bar: consolidate to single "About" link (remove "What is this?" / "Who built this?")
- [x] Nav bar: make mobile responsive (hamburger with mobile_menu.svg)
- [x] Hero assets need realignment (riff_lp.svg +28px, write_club_lp.svg +190px, 16px gaps, CTA 40px below "Start a")

### About Page
- [x] Remove noise background — put text on white background so it's readable
- [x] Replace placeholder dashed-border boxes with actual photos
- [x] Fix heading font size for mobile (too large on small screens)
- [x] Show mobile-specific screenshot on small screens using `<picture>` element

### Onboarding
- [ ] "Club name" field should auto-populate with first name (e.g. "Kyle's Club")
- [ ] Club photo: show visual preview by device
- [ ] Club photo: "delete" button should be a trash icon

### Club Page
- [x] Top-left logo should be icon only (not full wordmark) — uses riff_logo.svg
- [ ] Redesign club dropdown
- [x] If club has banner photo: dark overlay + club details centered on photo in white text (dark scrim)
- [x] Club Settings gear icon: admin can edit club name, description, and banner image
- [x] Replace gear icon (⚙) with minimal three-dot SVG button with cyan hover effect
- [x] "Invite friends" should open a modal instead of navigating to onboarding
- [x] Public club join page at /clubs/[id]/join (no token needed — shareable link)
- [x] New user join onboarding flow (/onboarding/join) — name setup then joins club
- [ ] 🔨 @jarric — Invite/join flow testing and improvements
- [x] Join page conversion modal ("what's a write club?" education flow)
- [ ] When riff is revealed, remove from "Current Riff" section

### Riff Creation / Management
- [ ] 🔨 @jarric — Volume number auto-assigned; riff name optional (not required to create)
- [ ] 🔨 @jarric — Due date mandatory on riff creation, defaults to 1 month out, admin can edit later
- [ ] Redesign prompts/inspiration UI
- [ ] After creating a riff, host sees "Start writing" or "Invite friends" CTA
- [ ] Don't show "Reveal pieces" until deadline passes OR all submissions are in

### Riff Card & Riff Page
- [ ] 🔨 @jarric — Update riff card: "waiting for X" / "submitted" states and CTA logic
- [ ] 🔨 @jarric — Design riff participant progress view on the riff page

### Riff Page
- [ ] 🔨 @jarric — Redesign riff page layout
- [x] Change back button styling (shared BackButton component, used across all back navigation)
- [ ] Share button doesn't work — wire up or remove

### Read / Write Experience
- [ ] YouTube embeds, images, Spotify links need to be mobile responsive
- [x] Cover image upload UI (CoverImageModal with upload, crop, piece image picker, HEIC support)

### Profile Page
- [ ] Change tab order to: Drafts, Pieces, Collections
- [ ] Drafts list not updating immediately after new piece is created
- [x] Add way to get back to club page from profile (BackButton using lastActiveClubId)

### Piece Management
- [ ] Let users manage piece state: draft vs. published, shared in riff vs. not ready to share
- [ ] Clear distinction between drafts (in progress), submitted pieces (shared to a riff), and personal pieces (not in a riff)

### Notifications
- [x] Notification bell uses SVG icon with unread count badge
- [ ] Clicking a notification should navigate to the relevant page

### Settings
- [x] Avatar upload and management

### Merge & Deploy
- [x] Merge `feature/polish-phase-1` to develop
- [x] Test full flow on Vercel (staging.letsriff.app deployed and working)

---

## Soon (post-staging, pre-launch)

- [ ] Notification emails via Resend (riff created, deadline approaching, pieces revealed, new comment)
- [ ] Deadline reminder cron job (Vercel Cron, 24h before deadline)
- [ ] Toast notifications replacing `console.error` catches
- [ ] Loading skeletons for ClubPageLayout, ProfilePage, RiffPageLayout
- [ ] Deployment environment badge (dev/staging/production indicator)
- [x] Onboarding invite step now generates /clubs/[id]/join links instead of single-use tokens
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
