// What the map shows, built from ARCHITECTURE.md. Pure functions only, so
// they can be checked against the real file outside a session.

import type { Area } from './areas.js'
import { modelEntries, treeEntries, type ArchDoc, type FileEntry } from './parse.js'

const MARKDOWN_LIMIT = 9_900

// What was found on disk when the map opened
export interface Listing {
  // src/components/<dir> -> its components
  components: ReadonlyMap<string, readonly string[]>
  // a screen's folder, such as src/app/home/ -> the files in it
  pageFiles: ReadonlyMap<string, readonly string[]>
}

function areaFiles(d: ArchDoc, area: Area) {
  const pick = (heading: string) =>
    treeEntries(d.blocks.get(heading) ?? [], '').filter((f) => area.files.test(f.path))
  const models = modelEntries(d.blocks.get('Database Schema') ?? [])
  const pages = pick('Pages')
  const isPublic = (f: FileEntry) => !!area.publicPages?.test(f.path)
  return {
    pages: pages.filter((f) => !isPublic(f)),
    publicPages: pages.filter(isPublic),
    api: pick('API Routes'),
    lib: pick('Hooks & Lib'),
    models: area.models.map((m) => models.get(m)).filter((m): m is string => !!m).map(oneLine),
  }
}

function areaSummary(d: ArchDoc, area: Area): string {
  if ('working' in area.summary) {
    return (d.working.get(area.summary.working) ?? []).map((b) => '- ' + b).join('\n')
  }
  return d.sections.get(area.summary.section) ?? ''
}

// "src/app/home/ — Unified feed · page.tsx, MyRiffsClient.tsx"
function describe(f: FileEntry, listing?: Listing): string {
  const files = listing?.pageFiles.get(f.path) ?? []
  return [f.note, files.join(', ')].filter(Boolean).join(' · ')
}

function fileList(title: string, entries: FileEntry[], listing?: Listing): string {
  if (entries.length === 0) return ''
  const rows = entries.map((f) => {
    const about = describe(f, listing)
    return '- `' + f.path + '`' + (about ? ' — ' + about : '')
  })
  return '**' + title + '**\n' + rows.join('\n')
}

// One row per folder. A folder named alone shows all of it; components named
// as "folder/Name" show only those, and only if they still exist.
function componentRows(area: Area, listing: Listing): [string, string][] {
  const folders = [...new Set(area.components.map((c) => c.split('/')[0] ?? c))]
  return folders
    .map((dir): [string, string] => {
      const all = listing.components.get(dir) ?? []
      const picked = area.components.filter((c) => c.startsWith(dir + '/')).map((c) => c.slice(dir.length + 1))
      const names = area.components.includes(dir) ? all : all.filter((n) => picked.includes(n))
      return ['src/components/' + dir + '/', names.join(', ')]
    })
    .filter(([, names]) => names.length > 0)
}

function componentList(area: Area, listing: Listing): string {
  const rows = componentRows(area, listing).map(([dir, names]) => '- `' + dir + '` — ' + names)
  return rows.length ? '**Building blocks (components)**\n' + rows.join('\n') : ''
}

export function areaMarkdown(d: ArchDoc, area: Area, listing: Listing): string {
  const files = areaFiles(d, area)
  const models = files.models.length ? '**What gets stored**\n' + modelBullets(files.models) : ''
  const parts = [
    '**More detail** (from the team notes in ARCHITECTURE.md)\n' + areaSummary(d, area),
    '**Where it lives in the code**\nGood places to start reading, or to point Claude at, when you change this part of the app.',
    fileList('Screens', files.pages, listing),
    fileList('Public pages (no sign-in needed)', files.publicPages, listing),
    fileList('Saving changes (API)', files.api),
    fileList('Helpers', files.lib),
    componentList(area, listing),
    models,
  ]
  return clamp(parts.filter(Boolean).join('\n\n'))
}

// What Claude reads beside a prompt that asks to build or explore an area.
// Sections with nothing in them are left out.
export function areaContext(d: ArchDoc, area: Area, listing: Listing): string {
  const files = areaFiles(d, area)
  const section = (title: string, rows: string[]) => (rows.length ? [title + ':', ...rows.map((r) => '  ' + r)] : [])
  const entries = (list: FileEntry[]) =>
    list.map((f) => {
      const about = describe(f, listing)
      return f.path + (about ? ' — ' + about : '')
    })
  return [
    'Riff map (riff-map mod): the user is working in the "' + area.label + '" area. Its files, from ARCHITECTURE.md:',
    ...section('Pages', entries(files.pages)),
    ...section('Public pages (no sign-in needed; probably not what the user means)', entries(files.publicPages)),
    ...section('API routes', entries(files.api)),
    ...section('Shared logic', entries(files.lib)),
    ...section('Components', componentRows(area, listing).map(([dir, names]) => dir + ': ' + names)),
    ...section('Models', files.models),
    'The user can see this map in a pane (/map ' + area.id + '). Use it as a starting point, and read the files before changing them.',
  ].join('\n')
}

// "User         → email,\n      bio" -> "User → email, bio"
function oneLine(model: string): string {
  return model.replace(/\s+/g, ' ').trim()
}

// Models as a list that wraps cleanly in a narrow pane
export function modelBullets(models: readonly string[]): string {
  return models
    .map(oneLine)
    .map((m) => m.replace(/^(\w+) → /, '- **$1** → '))
    .join('\n')
}

// Every model in the "Key models" block, as modelBullets
export function allModels(d: ArchDoc): string {
  return modelBullets([...modelEntries(d.blocks.get('Database Schema') ?? []).values()])
}

export function clamp(text: string): string {
  return text.length > MARKDOWN_LIMIT ? text.slice(0, MARKDOWN_LIMIT) + '\n\n…' : text
}
