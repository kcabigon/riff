# Riff — Master TODO

Last updated: May 16, 2026

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
- [x] Redesign mobile comment experience — easy commenting and navigation between comments in "comment" mode

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

## Production Readiness

### Kyle only (sensitive / infrastructure)
- [x] Privacy Policy page — write content, link from login page
- [x] Terms of Service page — write content
- [x] Production database — new Supabase project, run migrations, set env vars
- [x] Resend domain verification — verify letsriff.app, add SPF/DKIM/DMARC DNS records
- [x] Document missing env vars in `.env.example`
- [x] Deprecated schema cleanup — remove Circle models, password field

### Friends
- [ ] @derek — Fix localhost URL fallbacks: change all `http://localhost:3000` fallbacks to `https://letsriff.app` in API routes (`src/app/api/riffs/[id]/route.ts`, `src/app/api/clubs/[id]/join/route.ts`, `src/lib/env.ts`)
- [ ] @jarric — Error & 404 pages: create branded `src/app/error.tsx` and `src/app/not-found.tsx` matching the app's design system
- [ ] @derek — Security headers: add `headers()` function to `next.config.ts` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`
- [ ] @chris — Remove test pages: delete or gate `/test-*` pages behind `NODE_ENV !== "production"` check
- [ ] @jarric — Email unsubscribe: add unsubscribe link to notification emails + email preferences toggle in settings
- [ ] @chris — Loading states: add `loading.tsx` with loading skeletons for clubs, clubs/[id], riffs/[id], read/[pieceId], profile/[userId], settings
- [ ] @derek — Page metadata: add `metadata` exports to login, clubs/[id], riffs/[id], profile/[userId], read/[pieceId] pages
- [ ] @chris — Database indexes: add `@@index` to Piece(authorId), Comment(pieceId), Notification(recipientId), Riff(clubId) — coordinate with Kyle before migrating
- [ ] @derek — Move `prisma` CLI from dependencies to devDependencies in package.json

### Done
- [x] Favicon, apple touch icon, web manifest
- [x] OG image + default open graph and twitter meta tags
- [x] `metadataBase` set to letsriff.app
- [x] Sitemap (`src/app/sitemap.ts`)
- [x] robots.txt updated (block internal pages, add sitemap directive)
- [x] Page titles fixed (about, settings use title template)
- [x] `EMAIL_FROM` env var set in Vercel production

## Soon (post-launch)

- [ ] Notification emails via Resend — deadline approaching, new comment
- [ ] Deadline reminder cron job (Vercel Cron, 24h before deadline)
- [ ] Toast notifications replacing `console.error` catches
- [ ] Onboarding page refinements (create-club, join-club pages)

---

## Backlog (nice to have)

- [ ] Collections system (personal, group, circle)
- [ ] 🔨 @jarric — Multi-level sharing UI (CLUB, RIFF, INDIVIDUAL, PUBLIC)
- [ ] Permission helpers / reusable middleware
- [ ] Refactor editor: extract shared tiptap logic into `useRiffEditor` hook + unified `EditorToolbar`

---

## Tech Debt

- [ ] Fix tiptap Spotify `addPasteHandler` for v3.x API
- [ ] Update old circle routes for Next.js 16 async params (or deprecate)
- [ ] Upgrade Prisma from 6.1.0 to 7.3.0
- [ ] Replace `useState` hover patterns with imperative DOM handlers — `CTAButton`, `ClubDropdown`, `CommentSidebar`, `ThreeDotButton`, `DeletePieceModal`, `PiecesGrid`, `ShareModal`, `ReadyToRevealCard`, `CompletedRiffCard`, `RiffCard`, `PieceCard`
