import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

// A trimmed ARCHITECTURE.md in the real file's shape
const ARCHITECTURE = `# Riff — Architecture & Project Reference

**Last Updated**: September 27, 2026

**Tech Stack**: Next.js 16 · TypeScript · Prisma 6

---

## Current State (September 15, 2026)

### What's Working

**Clubs**
- Club page with progress cards
- Host roles: assign co-host, transfer host

**Riffs**
- Lifecycle: DRAFT → ACTIVE → REVEALED → COMPLETED

**Notifications & email**
- In-app bell + panel

## File Map

### Pages
\`\`\`
src/app/
├── page.tsx                      # Landing page
├── home/                         # Unified feed
├── clubs/[id]/                   # Club page
├── riffs/[id]/                   # Riff page (activity view)
└── auth/check-email/, auth/error/
\`\`\`

### API Routes
\`\`\`
src/app/api/
├── clubs/                        # CRUD, members, riffs, join, stats
│   └── [id]/assign-cohost, [id]/transfer-admin
├── riffs/                        # POST creates an open (clubless) riff
└── notifications/                # list, [id] mark read, unread-count
\`\`\`

### Hooks & Lib
\`\`\`
src/lib/
├── club-cadence.ts            # Daily cadence sweep
└── notifications.ts           # createNotification

src/middleware.ts              # Staging password gate
\`\`\`

## Database Schema (Key Models)

\`\`\`
Club         → name, adminId (host), moderatorId (co-host)
ClubMember   → role: ADMIN | MODERATOR | MEMBER
Riff         → clubId (NULLABLE — null = open riff),
               status: DRAFT | ACTIVE | REVEALED | COMPLETED
\`\`\`

## Access Model

Riff pieces need the riff to be REVEALED.

## Authentication

- **Provider**: Resend magic link
`

const PANE = {
  plugin: 'riff-map',
  component: 'Pane',
  requestId: 'riff-map',
  viewport: { columns: 160, rows: 40 },
  props: {
    title: 'Riff map',
    isFocused: true,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const FILE = { kind: 'file', size: 0, mtimeMs: 0, isLink: false } as const

// What Claude Code stamps on a command and a prompt the person typed
const COMPOSER = { kind: 'composer' } as const
const typed = (command: string, args: string) => ({
  command,
  args,
  origin: COMPOSER,
  presentation: { isFullscreen: true, columns: 160 },
})
const said = (text: string) => ({ text, origin: COMPOSER, wait: false })

type Opened = { id: string; focus?: true }

// Stubs for everything the mod asks Claude Code for. Returns what the mod did.
function stubClaudeCode(on: On, isPlaced = true) {
  const did = { opened: [] as Opened[], toasts: [] as string[], prompts: [] as { context?: readonly string[] }[] }
  on('session.root', () => ({ value: '/repo' }))
  on('fs.read', ($, e) => (e.path.endsWith('ARCHITECTURE.md') ? { value: ARCHITECTURE } : { deny: 'missing' }))
  on('fs.list', ($, e) => ({
    value: e.path?.endsWith('/clubs')
      ? [{ ...FILE, name: 'ClubPageLayout.tsx' }]
      : e.path?.endsWith('/shared')
        ? [{ ...FILE, name: 'SendToFriendsModal.tsx' }, { ...FILE, name: 'Modal.tsx' }]
        : /\/app\/home\/?$/.test(e.path ?? '')
        ? [{ ...FILE, name: 'MyRiffsClient.tsx' }, { ...FILE, name: 'page.tsx' }, { ...FILE, name: 'notes.md' }]
        : [],
  }))
  on('ui.open', ($, e) => {
    did.opened.push(e)
    return { value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'narrow' } }
  })
  on('ui.toast', ($, e) => {
    did.toasts.push(e.text)
    return { value: undefined }
  })
  on('prompt.submit', ($, e) => {
    did.prompts.push(e)
    return { text: e.text }
  })
  on('command.run', () => ({ text: 'ran the command' }))
  return did
}

test('/map opens the overview and every tab draws on both apps', async ($, on) => {
  const did = stubClaudeCode(on)
  expect(await $.command.run(typed('map', ''))).toEqual({})
  expect(did.opened[0]).toMatchObject({ id: 'riff-map', focus: true, closeOnEscape: true })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Code', text: /requireAuth\(\) first/ })).toBeDefined()
    expect(await ui.find({ type: 'Code', text: /Magic link email/ })).toBeDefined()
    expect(await ui.find({ key: 'glossary', text: /\*\*Prisma\*\*: how our code reads/ })).toBeDefined()
    expect(await ui.find({ key: 'intro', text: /a \*\*database\*\* remembers everything/ })).toBeDefined()

    await ui.press({ key: 'tab-data' })
    expect(await ui.find({ key: 'models', text: /- \*\*ClubMember\*\* → role: ADMIN/ })).toBeDefined()
    expect(await ui.find({ type: 'Code', text: /joins via/ })).toBeDefined()
    expect(await ui.find({ key: 'data-caption', text: /open riff/ })).toBeDefined()

    await ui.press({ key: 'tab-areas' })
    await ui.press({ key: 'area-clubs' })
    const clubs = await ui.find({ key: 'area' })
    expect(clubs?.props.text).toContain('`src/app/clubs/[id]/` — Club page')
    expect(clubs?.props.text).toContain('`src/app/api/clubs/[id]/assign-cohost, [id]/transfer-admin`')
    expect(clubs?.props.text).toContain('`src/components/clubs/` — ClubPageLayout')
    expect(clubs?.props.text).toContain('- **ClubMember** → role: ADMIN | MODERATOR | MEMBER')
    expect(clubs?.props.text).not.toContain('riffs/[id]')

    expect(await ui.find({ type: 'Code', text: /assign-cohost/ })).toBeDefined()
    expect(await ui.find({ key: 'area-blurb', text: /group that writes together/ })).toBeDefined()

    await ui.press({ key: 'area-riffs' })
    expect(await ui.find({ type: 'Code', text: /revealRiff\(\)/ })).toBeDefined()
    const riffs = await ui.find({ key: 'area' })
    expect(riffs?.props.text).toContain('Riff page (activity view)')
    expect(riffs?.props.text).toContain('- **Riff** → clubId (NULLABLE — null = open riff), status: DRAFT')

    await ui.press({ key: 'tab-flows' })
    await ui.press({ key: 'flow-riff' })
    expect(await ui.find({ type: 'Code', text: /7-day grace/ })).toBeDefined()
    expect(await ui.find({ key: 'flow-caption', text: /at least one submitted piece/ })).toBeDefined()
    await ui.press({ key: 'flow-access' })
    expect(await ui.find({ type: 'Code', text: /anyone, read-only/ })).toBeDefined()
    expect(await ui.find({ key: 'flow-source', text: /app\/read\/\[pieceId\]\/page\.tsx/ })).toBeDefined()
    await ui.press({ key: 'flow-daily' })
    expect(await ui.find({ type: 'Code', text: /decideForClub\(\)/ })).toBeDefined()

    await ui.press({ key: 'tab-overview' })
    await ui.unmount()
  }
})

test('/map <area> opens zoomed in, and an unknown area says what exists', async ($, on) => {
  stubClaudeCode(on)
  await $.command.run(typed('map', 'notif'))
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'area' }))?.props.text).toContain('src/app/api/notifications/')

  const unknown = await $.command.run(typed('map', 'spaceships'))
  expect(unknown.text).toMatch(/^No part of the app called "spaceships"\. Try one of: flows, home, clubs, riffs/)

  await $.command.run(typed('map', 'flows'))
  expect(await ui.find({ key: 'flow-riff' })).toBeDefined()
})

test('a prompt to build in an area opens the map once and briefs Claude', async ($, on) => {
  const did = stubClaudeCode(on)
  await $.prompt.submit(said('I want to add a co-host badge to clubs'))
  expect(did.opened).toEqual([{ id: 'riff-map', title: 'Riff map' }])
  const context = did.prompts[0]?.context?.join('\n') ?? ''
  expect(context).toContain('"Clubs" area')
  expect(context).toContain('src/app/clubs/[id]/ — Club page')

  // Same area again: no second pane, no repeated briefing
  await $.prompt.submit(said('now fix the club settings modal'))
  expect(did.opened.length).toBe(1)
  expect(did.prompts[1]?.context).toBeUndefined()

  // Questions without build intent, and slash commands, pass straight through
  await $.prompt.submit(said('what time is it in riffs land'))
  await $.prompt.submit(said('/review the notifications PR'))
  expect(did.opened.length).toBe(1)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'area' }))?.props.text).toContain('Club page')
})

test('on a narrow terminal the prompt trigger shows a toast instead', async ($, on) => {
  const did = stubClaudeCode(on, false)
  await $.prompt.submit(said('how does the reveal work?'))
  expect(did.toasts).toEqual(['Riff map: run /map riffs to see how Riffs fits together'])
  expect(did.prompts[0]?.context?.join('\n')).toContain('"Riffs" area')
})

test('/new-feature opens the map on the area it names and still runs', async ($, on) => {
  const did = stubClaudeCode(on)
  const answer = await $.command.run(typed('new-feature', 'unread badge on the notifications bell'))
  expect(answer.text).toBe('ran the command')
  expect(did.opened[0]).toMatchObject({ id: 'riff-map', focus: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'area' }))?.props.text).toContain('In-app bell + panel')
})

test('the home briefing names real files, labels public pages, and skips empty sections', async ($, on) => {
  const did = stubClaudeCode(on)
  await $.prompt.submit(said("let's build a new feature within the home page"))
  const context = did.prompts[0]?.context?.join('\n') ?? ''
  expect(context).toContain('"Home & feed" area')
  expect(context).toContain('Pages:\n  src/app/home/ — Unified feed · page.tsx, MyRiffsClient.tsx')
  expect(context).toContain('Public pages (no sign-in needed; probably not what the user means):\n  src/app/page.tsx — Landing page')
  expect(context).not.toContain('API routes:')
  expect(context).not.toContain('Models:')
  expect(context).not.toContain('notes.md')

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const home = (await ui.find({ key: 'area' }))?.props.text ?? ''
  expect(home).toContain('**Screens**\n- `src/app/home/` — Unified feed · page.tsx, MyRiffsClient.tsx')
  expect(home).toContain('**Public pages (no sign-in needed)**\n- `src/app/page.tsx` — Landing page')
})

test('an area can borrow single components from another folder', async ($, on) => {
  stubClaudeCode(on)
  await $.command.run(typed('map', 'friends'))
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const friends = (await ui.find({ key: 'area' }))?.props.text ?? ''
  expect(friends).toContain('- `src/components/shared/` — SendToFriendsModal')
  expect(friends).not.toContain('Modal.tsx')
  expect(friends).not.toContain(', Modal')
})
