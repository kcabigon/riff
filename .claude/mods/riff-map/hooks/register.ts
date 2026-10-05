// riff-map: draws Riff's system design in a pane.
//
// - /map [area] opens it (overview, or zoomed to one area such as clubs)
// - /new-feature opens it beside the feature flow
// - a prompt that asks to build or explore part of the app opens it on that
//   area once per session, and hands Claude that area's file map
//
// The file lists and summaries are read from ARCHITECTURE.md each time the
// map opens, so keeping that file current keeps them current. The diagrams in
// diagrams.ts are hand-drawn and name the code they were checked against.

import type { CoreEngineInterface, Register } from 'claude-code'
import { AREAS, areaById, findArea, wantsToExplore, type Area } from './areas.js'
import { allModels, areaContext, areaMarkdown, clamp } from './content.js'
import {
  AREA_DIAGRAMS,
  DATA_CAPTION,
  DATA_DIAGRAM,
  FLOWS,
  GLOSSARY,
  INTRO,
  LOGIN_CAPTION,
  LOGIN_DIAGRAM,
  SYSTEM_CAPTION,
  SYSTEM_DIAGRAM,
} from './diagrams.js'
import { parseArchitecture, treeEntries, type ArchDoc } from './parse.js'

const PANE = 'riff-map'

type Tab = 'overview' | 'data' | 'areas' | 'flows'

let tab: Tab = 'overview'
let areaId = AREAS[0]?.id ?? ''
let flowId = FLOWS[0]?.id ?? ''
let doc: ArchDoc | null = null
let docError = ''
// src/components/<dir> -> its components, listed when the map opens
const components = new Map<string, string[]>()
// A screen's folder (src/app/home/) -> its files, listed when the map opens
const pageFiles = new Map<string, string[]>()
// Areas the prompt hook has already opened the map for this session
const autoOpened = new Set<string>()

async function loadMap($: CoreEngineInterface): Promise<void> {
  const root = await $.session.root()
  try {
    doc = parseArchitecture(await $.fs.read(root + '/ARCHITECTURE.md'))
    docError = ''
  } catch {
    doc = null
    docError = 'Could not read ARCHITECTURE.md in ' + root + '. Start Claude Code from the riff repo.'
  }

  pageFiles.clear()
  const pages = doc ? treeEntries(doc.blocks.get('Pages') ?? [], '') : []
  // Only single folders: "auth/check-email/, auth/error/" names two
  for (const page of pages.filter((p) => p.path.endsWith('/') && !p.path.includes(','))) {
    try {
      const entries = await $.fs.list(root + '/' + page.path)
      // page.tsx first, since that's where a screen starts
      const files = entries
        .filter((x) => x.kind === 'file' && /\.tsx?$/.test(x.name))
        .map((x) => x.name)
        .sort((a, b) => (a === 'page.tsx' ? -1 : b === 'page.tsx' ? 1 : a.localeCompare(b)))
      pageFiles.set(page.path, files)
    } catch {
      pageFiles.set(page.path, [])
    }
  }

  components.clear()
  for (const dir of new Set(AREAS.flatMap((a) => a.components.map((c) => c.split('/')[0] ?? c)))) {
    try {
      const entries = await $.fs.list(root + '/src/components/' + dir)
      const names = entries
        .filter((x) => x.kind === 'dir' || /\.tsx?$/.test(x.name))
        .map((x) => (x.kind === 'dir' ? x.name + '/' : x.name.replace(/\.tsx?$/, '')))
      components.set(dir, names.sort())
    } catch {
      components.set(dir, [])
    }
  }
}

async function openMap($: CoreEngineInterface, asked: boolean): Promise<boolean> {
  const pane = { id: PANE, title: 'Riff map' }
  // focus and closeOnEscape accept only true, so add them only when asked
  const placed = await $.ui.open(asked ? { ...pane, focus: true, closeOnEscape: true } : pane)
  // The pane may already be open on another tab or area
  $.ui.invalidate('ui.render')
  return placed.isPlaced
}

// The terminal drops empty lines inside a Code block; a lone space survives
function keepBlankLines(source: string): string {
  return source.replace(/\n(?=\n)/g, '\n ')
}

// Sub-pages are lettered in order: a, b, c, …
function letter(index: number): string {
  return String.fromCharCode(97 + index)
}

function showArea(area: Area | undefined): void {
  tab = area ? 'areas' : 'overview'
  if (area) areaId = area.id
}

export const register: Register = (on) => {
  // Runs before the first prompt, and again after a reload
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'map',
        description: 'See how Riff works, with pictures (try /map clubs)',
        argumentHint: '[flows|' + AREAS.map((a) => a.id).join('|') + ']',
        immediate: true,
      })
    } catch (err) {
      $.ui.log('could not add /map: ' + String(err))
    }
    return next(e)
  })

  // /map, or /map <area>
  on('command.run', { command: 'map' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'flows') {
      await loadMap($)
      tab = 'flows'
      await openMap($, true)
      return {}
    }
    const area = areaById(arg)
    if (arg && !area) {
      return { text: 'No part of the app called "' + arg + '". Try one of: flows, ' + AREAS.map((a) => a.id).join(', ') }
    }
    await loadMap($)
    showArea(area)
    await openMap($, true)
    return {}
  })

  // /new-feature: show the map beside the feature flow, zoomed in if the
  // description names an area. The command itself runs as usual.
  on('command.run', { command: 'new-feature' }, async ($, e, next) => {
    await loadMap($)
    showArea(findArea(e.args))
    await openMap($, true)
    return next(e)
  })

  // "I want to add X to clubs", "how do reveals work?": open the map on that
  // area and give Claude its file map. Once per area per session.
  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind !== 'composer' || e.text.trimStart().startsWith('/')) return next(e)
    if (!wantsToExplore(e.text)) return next(e)
    const area = findArea(e.text)
    if (!area || autoOpened.has(area.id)) return next(e)
    autoOpened.add(area.id)

    await loadMap($)
    if (!doc) return next(e)
    showArea(area)
    const isPlaced = await openMap($, false)
    if (!isPlaced) $.ui.toast('Riff map: run /map ' + area.id + ' to see how ' + area.label + ' fits together')
    return next({ ...e, context: [...(e.context ?? []), areaContext(doc, area, { components, pageFiles })] })
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    const { Box, Text, Button, Code, Markdown } = $.ui.resolve(e)
    const redraw = () => $.ui.invalidate('ui.render')

    const tabButton = (id: Tab, label: string, hotkey: string) =>
      Button({
        key: 'tab-' + id,
        label,
        hotkey,
        plain: true,
        dimColor: tab !== id,
        onPress: () => {
          tab = id
          redraw()
        },
      })

    const tabs = Box({
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 3,
      children: [
        tabButton('overview', 'Big picture', '1'),
        tabButton('data', "What's stored", '2'),
        tabButton('areas', 'Parts of the app', '3'),
        tabButton('flows', 'How it works', '4'),
      ],
    })

    let body
    if (!doc) {
      body = [Text({ color: 'warning', children: [docError || 'Loading…'] })]
    } else if (tab === 'overview') {
      body = [
        Markdown({ key: 'intro', text: INTRO }),
        Code({ source: keepBlankLines(SYSTEM_DIAGRAM) }),
        Markdown({ key: 'system-caption', text: SYSTEM_CAPTION, dimColor: true }),
        Markdown({ key: 'glossary', text: GLOSSARY }),
        Markdown({ key: 'login-title', text: '**Signing in**' }),
        Code({ source: keepBlankLines(LOGIN_DIAGRAM) }),
        Markdown({ key: 'login-caption', text: LOGIN_CAPTION, dimColor: true }),
        Markdown({
          key: 'next',
          text: 'Press **3** to explore one part of the app, or **4** to see how things work step by step.',
        }),
      ]
    } else if (tab === 'data') {
      body = [
        Code({ source: keepBlankLines(DATA_DIAGRAM) }),
        Markdown({ key: 'data-caption', text: DATA_CAPTION, dimColor: true }),
        Markdown({
          key: 'models-title',
          text: '**In the database**\nThe exact details, for when you ask Claude to change something (`prisma/schema.prisma`):',
        }),
        Markdown({ key: 'models', text: clamp(allModels(doc)) }),
      ]
    } else if (tab === 'flows') {
      const flow = FLOWS.find((f) => f.id === flowId) ?? FLOWS[0]
      body = [
        Box({
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 2,
          children: FLOWS.map((f, i) =>
            Button({
              key: 'flow-' + f.id,
              label: f.label,
              hotkey: letter(i),
              plain: true,
              dimColor: f.id !== flow?.id,
              onPress: () => {
                flowId = f.id
                redraw()
              },
            }),
          ),
        }),
        ...(flow
          ? [
              Code({ source: keepBlankLines(flow.diagram) }),
              Markdown({ key: 'flow-caption', text: flow.caption }),
              Markdown({ key: 'flow-source', text: 'In the code: `' + flow.source + '`', dimColor: true }),
            ]
          : []),
      ]
    } else {
      const area = AREAS.find((a) => a.id === areaId) ?? AREAS[0]
      body = [
        Box({
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 2,
          children: AREAS.map((a, i) =>
            Button({
              key: 'area-' + a.id,
              label: a.label,
              hotkey: letter(i),
              plain: true,
              dimColor: a.id !== area?.id,
              onPress: () => {
                areaId = a.id
                redraw()
              },
            }),
          ),
        }),
        ...(area ? [Markdown({ key: 'area-blurb', text: area.blurb })] : []),
        ...(area && AREA_DIAGRAMS[area.id] ? [Code({ source: keepBlankLines(AREA_DIAGRAMS[area.id] ?? '') })] : []),
        ...(area ? [Markdown({ key: 'area', text: areaMarkdown(doc, area, { components, pageFiles }) })] : []),
      ]
    }

    const footer = Text({
      dimColor: true,
      children: ['Esc to close · /map clubs (or riffs, writing…) jumps straight to a part of the app'],
    })

    return Box({
      flexDirection: 'column',
      children: [tabs, ...body.flatMap((part) => [Text({ children: [' '] }), part]), Text({ children: [' '] }), footer],
    })
  })
}
