# Plan: Profile piece access lock by club membership

**Branch**: `fix/profile-piece-access-lock`
**File**: `src/app/profile/[userId]/page.tsx` (only)

## Problem
Profile shows revealed pieces as unlocked/clickable even when the viewer isn't a member of the riff's club. They get silently redirected on the read page.

## Fix

### Step 1 — Fetch viewer's club IDs
```ts
const viewerMemberships = await prisma.clubMember.findMany({
  where: { userId: currentUserId },
  select: { clubId: true },
});
const viewerClubIds = new Set(viewerMemberships.map((m) => m.clubId));
```

### Step 2 — Add clubId to piece query
```ts
riff: { select: { status: true, clubId: true } }
```

### Step 3 — Update isRevealed to require club membership
```ts
isRevealed: p.riffs.some(
  (r) =>
    (r.riff.status === "REVEALED" || r.riff.status === "COMPLETED") &&
    viewerClubIds.has(r.riff.clubId)
),
```

**Note**: Own profile bypasses lock via `isOwnProfile` in PiecesGrid — no changes needed there.

## Scope
~10 lines, 1 file. No schema changes, no component changes.

## Result
| Scenario | Before | After |
|---|---|---|
| Not revealed, any visitor | 🔒 locked | 🔒 locked |
| Revealed, same club | unlocked ✓ | unlocked ✓ |
| Revealed, different club | unlocked → silent redirect | 🔒 locked |
| Own profile | always unlocked | always unlocked |
