# Plan: Fix Comment Re-Anchoring Bug

**Status:** Waiting — do not start until Derek's PR #91 (`fix/comment-sidebar-bugs`) is merged  
**Branch to create:** `fix/comment-reanchoring`  
**Base:** `develop` (sync before starting)

---

## The Bug

When an author edits their piece after comments have been left, comments break in two ways:

1. **Wrong anchor** — the re-anchor logic uses `indexOf(selectedText)` which always returns the first occurrence. If "surf" appears twice in a piece about surfing, a comment on the bottom "surf" silently moves to the top one.
2. **Deleted comments** — if `indexOf` returns -1 (text was edited away), the current code deletes the comment permanently. This is too aggressive.

Both issues are in `src/app/api/pieces/[id]/autosave/route.ts` lines 89–125.

---

## The Solution

On every autosave, count occurrences of `selectedText` in the new content and branch:

| Occurrences | Action |
|---|---|
| 0 | Text was deleted → **unanchor** (null out positions, keep `selectedText`) |
| 1 | Unique passage → **re-anchor** (update `selectionStart`/`selectionEnd`) |
| 2+ | Ambiguous → **unanchor** (null out positions, keep `selectedText`) |

**Key insight:** Short words like "surf" naturally have duplicates and can't be safely re-anchored. Long passages like "that one time I stepped into the mellow surf" are naturally unique and re-anchor confidently. The occurrence count self-calibrates — no length thresholds or heuristics needed.

**Key insight:** `selectedText` is already stored as a string and already displayed as a block quote in the mobile `CommentDrawer`. An unanchored comment still communicates "this comment was about *this* passage" — nothing meaningful is lost.

---

## Files to Change

### 1. `src/app/api/pieces/[id]/autosave/route.ts` (lines 89–125)

Replace the current re-anchor block with occurrence-count branching.

**Current logic (broken):**
```ts
const newIndex = currentContent.indexOf(comment.selectedText);

if (newIndex === -1) {
  await prisma.comment.delete({ where: { id: comment.id } }); // ❌ deletes forever
} else if (comment.selectionStart !== null && newIndex !== comment.selectionStart) {
  await prisma.comment.update({ ... }); // ❌ always picks first occurrence
}
```

**New logic:**
```ts
// Count all occurrences of selectedText in new content
const occurrences: number[] = [];
let searchFrom = 0;
while (true) {
  const idx = currentContent.indexOf(comment.selectedText, searchFrom);
  if (idx === -1) break;
  occurrences.push(idx);
  searchFrom = idx + 1;
}

if (occurrences.length === 1) {
  // Unique — safe to re-anchor
  const newIndex = occurrences[0];
  if (comment.selectionStart !== newIndex) {
    await prisma.comment.update({
      where: { id: comment.id },
      data: {
        selectionStart: newIndex,
        selectionEnd: newIndex + comment.selectedText.length,
      },
    });
  }
} else {
  // 0 occurrences (deleted) or 2+ (ambiguous) — unanchor, preserve reference
  if (comment.selectionStart !== null) {
    await prisma.comment.update({
      where: { id: comment.id },
      data: {
        selectionStart: null,
        selectionEnd: null,
        // selectedText preserved intentionally — it's the quoted reference
      },
    });
  }
}
```

### 2. `src/components/read/CommentSidebar.tsx`

Currently, comments with no `<mark>` in the DOM simply don't appear in the sidebar — they fall off the `items` list silently. Need a fallback section for unanchored comments.

**What to add:**
- After building the `items` list from DOM mark positions, collect comments that had no mark found
- Render unanchored comments stacked below the anchored ones, separated by a light divider
- Show the `selectedText` quote on each unanchored card (same as the mobile drawer does)
- Use a muted label like "Comment on edited text" to signal the context shift

**Where:** In the `updatePositions` callback and in the render return — after the `comments.map(...)` block.

### 3. `src/components/read/CommentDrawer.tsx` (mobile)

No changes needed. Already renders `comment.selectedText` as a block quote regardless of anchor state. Works perfectly for unanchored comments.

### 4. `src/components/read/CommentAnchor.tsx` — `injectHighlights` function

Currently uses `result.indexOf(comment.selectedText)` which has the same first-occurrence problem for display. Low priority since the autosave fix prevents the DB from storing wrong positions, but worth a note:

- `injectHighlights` already filters `c.selectionStart != null` — so unanchored comments are skipped for highlight injection automatically. No change needed for the unanchor path.
- For re-anchored comments (unique passages), `indexOf` is fine since there's exactly one occurrence by definition.
- This file likely needs no changes once the autosave fix is in.

---

## Schema

No migrations needed. `selectionStart`, `selectionEnd`, and `selectedText` are already nullable in `prisma/schema.prisma`:

```
selectionStart Int?
selectionEnd   Int?
selectedText   String?
```

---

## Testing Checklist

- [ ] Author fixes a typo at top of piece → comments at bottom stay anchored and highlighted
- [ ] Author deletes a commented passage → that comment becomes unanchored, appears in sidebar with quoted reference, `selectedText` visible
- [ ] Piece about surfing with "surf" appearing 5 times, comment on last one → on edit, comment becomes unanchored (ambiguous), not remapped to first "surf"
- [ ] Long unique passage commented → on edit that doesn't touch the passage → comment re-anchors correctly to new position
- [ ] Multiple comments, some unique passages, some short words → each handled independently per the branching logic
- [ ] Unanchored comments visible in sidebar below anchored ones
- [ ] Mobile drawer still shows quoted text for unanchored comments
- [ ] No comments ever deleted by the system (only by commenter or author explicitly)

---

## Context & Prerequisites

- **Wait for:** PR #91 (`fix/comment-sidebar-bugs` by Derek) to merge into develop
- **Why:** Derek's PR touches the comment sidebar. Building on top of it avoids merge conflicts and ensures this fix builds on a stable comment foundation.
- **Sync develop** before branching: `git checkout develop && git pull origin develop`

---

## Related Files (for orientation when picking this up)

```
src/app/api/pieces/[id]/autosave/route.ts   # Core fix — re-anchor logic
src/app/api/comments/route.ts               # GET comments (orderBy selectionStart)
src/app/api/comments/create/route.ts        # Comment creation — no changes needed
src/components/read/CommentAnchor.tsx       # injectHighlights — likely no changes
src/components/read/CommentSidebar.tsx      # Add unanchored comment fallback section
src/components/read/CommentDrawer.tsx       # Mobile — no changes needed
src/components/read/CommentPopover.tsx      # Comment compose — no changes needed
```
