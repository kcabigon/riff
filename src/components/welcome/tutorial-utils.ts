export type EaseFn = (t: number) => number;

export const Ease = {
  linear: (t: number) => t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t: number) => {
    const c = 1.70158,
      k = c + 1;
    return 1 + k * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};

export function rangeProgress(
  t: number,
  start: number,
  end: number,
  ease?: EaseFn
): number {
  if (t <= start) return 0;
  if (t >= end) return 1;
  const u = (t - start) / (end - start);
  return ease ? ease(u) : u;
}

export function sceneEnvelope(
  t: number,
  start: number,
  end: number,
  entry = 0.5,
  exit = 0.5
): number {
  if (t < start || t > end) return 0;
  const local = t - start;
  const dur = end - start;
  if (local < entry) return Ease.out(local / entry);
  if (local > dur - exit) return 1 - Ease.out((local - (dur - exit)) / exit);
  return 1;
}

export function sceneRise(time: number, start: number, entry = 0.5): number {
  if (time < start) return 0;
  const u = (time - start) / entry;
  if (u >= 1) return 1;
  return Ease.out(Math.max(0, u));
}

export interface Annotation {
  note: string;
  arrowFrom?: [number, number];
  arrowTo?: [number, number];
  notePos?: { x: number; y: number };
  noArrow?: boolean;
  maxWidth?: number;
  startOffset?: number;
  arrowFadeOut?: { start: number; dur: number };
}

export interface SceneTransition {
  riffOut: { start: number; dur: number };
  writeIn: { start: number; dur: number };
  lockStart?: number;
}

export interface Scene {
  id: "intro" | "club" | "riff" | "write" | "reveal" | "read";
  start: number;
  end: number;
  headline: string[];
  highlightColor: string;
  readyAt: number;
  skipProgress?: boolean;
  note?: string;
  arrowFrom?: [number, number];
  arrowTo?: [number, number];
  notePos?: { x: number; y: number };
  annotations?: Annotation[];
  transition?: SceneTransition;
}

export const SCENES: Scene[] = [
  {
    id: "intro",
    start: 0,
    end: 6,
    headline: [],
    highlightColor: "#00FF66",
    readyAt: 4.2,
    skipProgress: true,
  },
  {
    id: "club",
    start: 6,
    end: 16,
    headline: ["Welcome to", "write club."],
    highlightColor: "#00FF66",
    readyAt: 6,
    note: "this is the club page,\nand here's you and your friends",
    arrowFrom: [440, 505],
    arrowTo: [830, 305],
    notePos: { x: 80, y: 380 },
  },
  {
    id: "riff",
    start: 16,
    end: 25,
    headline: ["Every month,", "a new riff."],
    highlightColor: "#01EFFC",
    readyAt: 7,
    note: "this is the riff page,\neveryone writes before\ntime runs out",
    arrowFrom: [410, 470],
    arrowTo: [1050, 230],
    notePos: { x: 80, y: 350 },
  },
  {
    id: "write",
    start: 25,
    end: 39,
    headline: ["Write in", "parallel."],
    highlightColor: "#EECF01",
    readyAt: 13,
    transition: {
      riffOut: { start: 8.0, dur: 0.9 },
      writeIn: { start: 8.5, dur: 1.0 },
      lockStart: 11.5,
    },
    annotations: [
      {
        note: "your title and word count\nare visible to friends",
        arrowFrom: [430, 435],
        arrowTo: [870, 415],
        notePos: { x: 80, y: 400 },
        arrowFadeOut: { start: 8.0, dur: 0.55 },
      },
      {
        note: "but your writing stays private\nuntil the reveal",
        notePos: { x: 80, y: 520 },
        maxWidth: 440,
        noArrow: true,
        startOffset: 10.0,
      },
    ],
  },
  {
    id: "reveal",
    start: 39,
    end: 49,
    headline: ["Then —", "all at once."],
    highlightColor: "#FF6B35",
    readyAt: 7.5,
    annotations: [
      {
        note: "once everyone submits,\npieces unlock simultaneously",
        notePos: { x: 80, y: 410 },
        noArrow: true,
        startOffset: 5.5,
      },
    ],
  },
  {
    id: "read",
    start: 49,
    end: 59,
    headline: ["The riff", "goes on in", "the comments."],
    highlightColor: "#C01582",
    readyAt: 7.5,
    note: "like leaving notes\nin the margin",
    notePos: { x: 80, y: 430 },
  },
];

export function getAnnotations(scene: Scene): Annotation[] {
  if (scene.annotations && scene.annotations.length) return scene.annotations;
  return [
    {
      note: scene.note ?? "",
      arrowFrom: scene.arrowFrom,
      arrowTo: scene.arrowTo,
      notePos: scene.notePos,
    },
  ];
}

export function annotationTiming(
  scene: Scene,
  idx: number
): {
  tokens: string[];
  noteStart: number;
  noteEnd: number;
  arrowStart: number;
  arrowEnd: number;
} {
  const NOTE_START = 2.4;
  const NOTE_PER_WORD = 0.16;
  const ARROW_GAP = 0.5;
  const ARROW_DUR = 1.3;
  const INTER_GAP = 0.6;

  const annotations = getAnnotations(scene);

  let cursor =
    annotations[0]?.startOffset != null
      ? scene.start + annotations[0].startOffset
      : scene.start + NOTE_START;

  for (let i = 0; i < idx; i++) {
    const a = annotations[i];
    const words = (a.note ?? "")
      .split(/(\s+)/)
      .filter((t) => !/^\s+$/.test(t) && t.length);
    const noteEnd = cursor + words.length * NOTE_PER_WORD + 0.2;
    const arrowEnd = a.noArrow ? noteEnd : noteEnd + ARROW_GAP + ARROW_DUR;
    cursor = arrowEnd + INTER_GAP;
  }

  const a = annotations[idx];
  const tokens = (a.note ?? "").split(/(\s+)/);
  const words = tokens.filter((t) => !/^\s+$/.test(t) && t.length);
  const noteStart =
    idx > 0 && a.startOffset != null ? scene.start + a.startOffset : cursor;
  const noteEnd = noteStart + words.length * NOTE_PER_WORD + 0.2;
  const arrowStart = noteEnd + ARROW_GAP;
  const arrowEnd = arrowStart + ARROW_DUR;

  return { tokens, noteStart, noteEnd, arrowStart, arrowEnd };
}
