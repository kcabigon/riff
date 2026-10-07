// Reads ARCHITECTURE.md into the pieces the map draws. Pure functions only:
// the hooks module does the file reading and passes the text in.

export interface ArchDoc {
  updated: string
  techStack: string
  // "What's Working" bullets, keyed by their bold heading ("Clubs", "Riffs", …)
  working: Map<string, string[]>
  // Prose under each ## or ### heading, without code blocks
  sections: Map<string, string>
  // The first code block under each heading
  blocks: Map<string, string[]>
}

export interface FileEntry {
  path: string
  note: string
}

export function parseArchitecture(md: string): ArchDoc {
  const doc: ArchDoc = {
    updated: md.match(/\*\*Last Updated\*\*:\s*(.+)/)?.[1]?.trim() ?? '',
    techStack: md.match(/\*\*Tech Stack\*\*:\s*(.+)/)?.[1]?.trim() ?? '',
    working: new Map(),
    sections: new Map(),
    blocks: new Map(),
  }

  let heading = ''
  let workingGroup = ''
  let inFence = false
  let fence: string[] | null = null

  for (const line of md.split('\n')) {
    if (line.startsWith('```')) {
      if (inFence) {
        if (fence && !doc.blocks.has(heading)) doc.blocks.set(heading, fence)
        fence = null
      } else {
        fence = []
      }
      inFence = !inFence
      continue
    }
    if (inFence) {
      fence?.push(line)
      continue
    }

    const h = line.match(/^#{2,3}\s+(.+)/)
    if (h?.[1]) {
      heading = h[1].replace(/\s*\(.*\)$/, '').trim()
      workingGroup = ''
      continue
    }

    doc.sections.set(heading, (doc.sections.get(heading) ?? '') + line + '\n')

    if (heading === "What's Working") {
      const group = line.match(/^\*\*(.+)\*\*\s*$/)
      if (group?.[1]) {
        workingGroup = group[1]
        doc.working.set(workingGroup, [])
      } else if (workingGroup && line.startsWith('- ')) {
        doc.working.get(workingGroup)?.push(line.slice(2))
      }
    }
  }

  for (const [key, body] of doc.sections) {
    doc.sections.set(key, body.replace(/^-{3,}\s*$/gm, '').trim())
  }
  return doc
}

// Turns a file-map tree block into full paths with their notes.
// `base` is the root for blocks that don't name one (Pages, API Routes).
export function treeEntries(lines: readonly string[], base: string): FileEntry[] {
  const entries: FileEntry[] = []
  let root = base
  let parent = ''

  for (const raw of lines) {
    if (!raw.trim()) continue
    const [body = '', ...noteParts] = raw.split(/\s+#\s/)
    const note = noteParts.join(' # ').trim()
    const prefix = body.match(/^[│├└─\s]*/)?.[0] ?? ''
    const name = body.slice(prefix.length).trim()
    if (!name) continue

    // A bare directory line such as "src/lib/" starts a new root
    if (!prefix && !note && name.endsWith('/')) {
      root = name
      parent = ''
      continue
    }
    // A bare file line such as "src/middleware.ts" is already a full path
    if (!prefix) {
      entries.push({ path: name, note })
      continue
    }

    const isNested = prefix.length > 4
    const path = isNested ? parent + name : name
    if (!isNested) parent = name.endsWith('/') ? name : name + '/'
    entries.push({ path: root + path, note })
  }
  return entries
}

// Splits the "Key Models" block into one entry per model, keeping the
// indented continuation lines with the model they belong to.
export function modelEntries(lines: readonly string[]): Map<string, string> {
  const models = new Map<string, string>()
  let current = ''
  for (const line of lines) {
    const start = line.match(/^(\w+)\s/)
    if (start?.[1]) {
      current = start[1]
      models.set(current, line)
    } else if (current && line.trim()) {
      models.set(current, models.get(current) + '\n' + line)
    }
  }
  return models
}
