"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  "tHe StRaNgE cAsE" · immersive reader — single-piece cinematic read experience
 * ─────────────────────────────────────────────────────────────────────────────
 *  A hardcoded, award-grade cinematic reading experience for ONE piece.
 *
 *  Hand-rolled, zero external deps:
 *   · WebGL fragment shader — domain-warped fbm noise, mood-lerped palette,
 *     mouse-reactive bloom, chromatic aberration, breathing vignette, film grain.
 *   · Per-character kinetic typography with mood-specific reveal physics.
 *   · Custom blended cursor that bends the shader light + 3D parallax depth.
 *   · Cinematic letterbox on photos, ambient act-markers, scanline grade.
 *   · Optional generative Web Audio score (off by default) that tracks the mood.
 *
 *  Content is VERBATIM. Reader controls tempo (tap/click/space/arrow/swipe to
 *  advance, back-arrow/Esc to exit). Gated in src/app/read/[pieceId]/page.tsx by a
 *  single piece ID behind EXPERIMENT_ENABLED (after the normal access check) — flip
 *  that flag off to restore the default read view. No DB writes; no other piece
 *  affected. Palette/img/index-key lint is intentionally disabled for this file in
 *  eslint.config.mjs (bespoke art direction).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── Photo slots ──────────────────────────────────────────────────────────────
const PHOTOS: Record<string, { src: string; alt: string } | null> = {
  opening: null, // a sun-drenched "ideal life" frame
  turn: null, // the rupture
  abyss: null, // the 3am screen-glow stare
  kids: null, // the kids (gut-punch)
  exhilaration1: {
    src: "https://wtfudrzuqbrebbsvapsy.supabase.co/storage/v1/object/public/images/06899973-e7ba-4c65-9b45-6c2634aad742.jpg",
    alt: "",
  },
  exhilaration2: {
    src: "https://wtfudrzuqbrebbsvapsy.supabase.co/storage/v1/object/public/images/3121fb66-ac20-4fb1-9eb3-1141ed6128d6.jpg",
    alt: "",
  },
};

type Mood =
  | "title"
  | "past"
  | "list"
  | "lux"
  | "turn"
  | "present"
  | "question"
  | "answer"
  | "whisper"
  | "echo"
  | "end";

type Beat =
  | {
      id: string;
      kind: "text";
      mood: Mood;
      lines: string[];
      long?: boolean;
      listNum?: string;
      bg?: string;
      collage?: string[];
    }
  | { id: string; kind: "title" }
  | { id: string; kind: "photo"; slot: string }
  | {
      id: string;
      kind: "bullet";
      n: number;
      img: string | null;
      lines: string[];
      pos?: string;
    }
  | { id: string; kind: "end" };

const IMG = "/experiment/strange-case/";
const BULLET_TOTAL = 9;
// the two "exhilarating" collages, sliced into their 6 photos each — laid out
// responsively (2x3 portrait on mobile, reflowed to 3x2 landscape on desktop)
const COLLAGE1 = Array.from({ length: 6 }, (_, i) => `${IMG}ex1-${i + 1}.webp`);
const COLLAGE2 = Array.from({ length: 6 }, (_, i) => `${IMG}ex2-${i + 1}.webp`);

// ── The piece, verbatim, choreographed into beats ────────────────────────────
const BEATS: Beat[] = [
  { id: "title", kind: "title" },

  {
    id: "b1",
    kind: "text",
    mood: "past",
    long: true,
    lines: [
      "for the better part of the last 6 years, bookended by a ribonucleic acid contagion and michael b. jordan's questionable oscar triumph, i lived, categorically and rather self-consciously, a spectacularly ideal existence.",
    ],
  },
  {
    id: "b2",
    kind: "text",
    mood: "past",
    long: true,
    lines: [
      "while the world painfully picked up the pieces of their lives, pulverized by the pandemic, i squeezed into a half dozen years what generations before me would consider hedonism sufficient for a lifetime.",
    ],
  },
  {
    id: "b3",
    kind: "text",
    mood: "past",
    lines: ["it would be embarrassing to enumerate."],
  },
  {
    id: "b4",
    kind: "text",
    mood: "past",
    lines: ["i won't trouble you with the specifics."],
  },
  { id: "b5", kind: "text", mood: "past", lines: ["here are the specifics:"] },

  {
    id: "l1",
    kind: "bullet",
    n: 1,
    img: `${IMG}1.webp`,
    lines: ["i lived and worked inside of my house."],
  },
  {
    id: "l2",
    kind: "bullet",
    n: 2,
    img: `${IMG}2.webp`,
    lines: [
      'narcissism personified, i looked in the mirror and said, "i want little versions of you running around" and created offspring.',
    ],
  },
  {
    id: "l3",
    kind: "bullet",
    n: 3,
    img: `${IMG}3.webp`,
    lines: [
      "unsatisfied with the home i owned, i procured another in a more aquatic locale, then commissioned a group of immigrants to reconstruct it to my liking.",
    ],
  },
  {
    id: "l4",
    kind: "bullet",
    n: 4,
    img: `${IMG}14.webp`,
    lines: [
      "to truly absorb the culture of a foreign country, vacations with the family were a month long at a minimum.",
    ],
  },
  {
    id: "l5",
    kind: "bullet",
    n: 5,
    img: `${IMG}11.webp`,
    lines: ["i got fit."],
  },
  {
    id: "l6",
    kind: "bullet",
    n: 6,
    img: `${IMG}6.webp`,
    pos: "20% 50%",
    lines: ["i grew closer to my wife."],
  },
  {
    id: "l7",
    kind: "bullet",
    n: 7,
    img: `${IMG}7.webp`,
    lines: ["i watched, mesmerizingly up close, as my children grew up."],
  },
  {
    id: "l8",
    kind: "bullet",
    n: 8,
    img: `${IMG}8.webp`,
    lines: ["i celebrated and mourned, in person, with my friends and family."],
  },
  {
    id: "l9",
    kind: "bullet",
    n: 9,
    img: `${IMG}9.webp`,
    lines: ["I showed up. I was present."],
  },

  {
    id: "b15",
    kind: "text",
    mood: "lux",
    long: true,
    lines: [
      'logically, a lot this luxurious is only possible with adequate time and money — a consequence of a tenured professional arrangement that allowed me to casually dial into work calls while preoccupied with the way my lawn chair was situated on the beach sand, occasionally unmuting myself to add a perfunctory contribution like, "let me think about how this lines up with our strategy and circle back" — a proverbial mic drop — muting again while triggering a broad debate, buying myself some time to feel more of the summer wind in my face.',
    ],
  },

  {
    id: "b16",
    kind: "text",
    mood: "turn",
    lines: [
      "ALAS, FOR REASONS I HAVE YET TO PROCESS, I DECIDED TO THROW IT ALL AWAY.",
    ],
  },

  {
    id: "b17",
    kind: "text",
    mood: "present",
    long: true,
    lines: [
      "THESE DAYS, WITH A FERVOR THAT WOULD OUTPACE AN EARLY-GRAD OF THE ZIRP ERA, I GRIND.",
    ],
  },
  {
    id: "b18",
    kind: "text",
    mood: "present",
    lines: [
      "I GRIND AT HOME.",
      "I GRIND IN PERSON — SAN FRANCISCO, LAS VEGAS, SEOUL —",
      "I GRIND IN ALL TIMEZONES.",
    ],
  },
  {
    id: "b19a",
    kind: "text",
    mood: "present",
    long: true,
    lines: [
      "NO LONGER BEARING THE BURDEN OF CONTEXT, I FLOAT BUT BARELY TREAD THE TOKENIZED WATERS OF A COMPANY FORGED IN THE FIRES OF A NEW ERA:",
    ],
  },
  {
    id: "b19b",
    kind: "text",
    mood: "present",
    long: true,
    lines: [
      "A COLLEAGUE ASKED ME THE OTHER DAY,",
      '"DON’T YOU THINK WE SHOULD QUANTIZE THESE EMBEDDINGS IN A NON-EUCLIDEAN VECTOR SPACE SO WE CAN DO HIERARCHICAL SEARCH?"',
    ],
  },
  {
    id: "b20",
    kind: "text",
    mood: "present",
    lines: ["I STARE BLANKLY INTO THE ABYSS."],
  },
  {
    id: "b21",
    kind: "text",
    mood: "present",
    lines: ["WHAT THE FUCK DOES QUANTIZE MEAN?", "I STAY UP UNTIL 3AM."],
  },

  { id: "b22", kind: "text", mood: "question", lines: ["what have you done?"] },
  {
    id: "b23",
    kind: "text",
    mood: "answer",
    lines: [
      "I’M NOT ENTIRELY SURE.",
      "IT’S HARD TO THINK.",
      "I HAVEN’T EATEN YET. OR EXERCISED IN MONTHS.",
    ],
  },
  { id: "b24", kind: "text", mood: "question", lines: ["what about my wife?"] },
  { id: "b25", kind: "text", mood: "answer", lines: ["I HAVEN’T SEEN HER."] },
  { id: "b26", kind: "text", mood: "question", lines: ["and the kids?"] },
  {
    id: "b27",
    kind: "text",
    mood: "answer",
    lines: ["THEY ASKED IF I DIED THE OTHER DAY."],
  },
  { id: "b28", kind: "text", mood: "whisper", lines: ["heartbreaking."] },

  {
    id: "b29",
    kind: "text",
    mood: "present",
    long: true,
    lines: [
      "I HOPE THEY’LL UNDERSTAND ONE DAY THAT DADDY HAD TO SHIP, TO LEARN, TO CONTRIBUTE TO THE APOCALYPSE. FOR THEM. FOR US.",
    ],
  },
  {
    id: "b30",
    kind: "text",
    mood: "whisper",
    lines: ["they won’t. i certainly didn’t."],
  },

  {
    id: "b31",
    kind: "text",
    mood: "present",
    long: true,
    lines: [
      "I’M SPRINTING TOWARD SOMETHING.",
      "ADRENALINE MAYBE? THE SATISFACTION OF BUILDING SOMETHING, ANYTHING ENDURING, GROUNDBREAKING.",
      "MAYBE A LEGACY?",
      "NO THAT’S TOO RIGHTEOUS. SIMPLER.",
      "JUST A SENSE OF ACCOMPLISHMENT.",
    ],
  },
  {
    id: "b32",
    kind: "text",
    mood: "present",
    long: true,
    collage: COLLAGE1,
    lines: [
      "IT’S EXHILARATING. THERE’S NO FEELING QUITE LIKE THIS. THIS IS IT — I’M EXACTLY WHERE I WANT TO BE, SURROUNDED BY MY PEOPLE, DOING WHAT I LOVE.",
    ],
  },
  {
    id: "b33",
    kind: "text",
    mood: "echo",
    long: true,
    collage: COLLAGE2,
    lines: [
      "it’s exhilarating. there’s no feeling quite like this. this is it — i’m exactly where i want to be, surrounded by my people, doing what i love.",
    ],
  },

  { id: "end", kind: "end" },
];

const moodOf = (b: Beat): Mood =>
  b.kind === "text"
    ? b.mood
    : b.kind === "title"
      ? "title"
      : b.kind === "end"
        ? "end"
        : b.kind === "bullet"
          ? "list"
          : "present";

// ── Shader mood palettes (normalized rgb + scalar grades) ────────────────────
type Vis = {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  glow: [number, number, number];
  glowStr: number;
  grain: number;
  warp: number;
  vig: number;
  aber: number;
};
const VIS: Record<Mood, Vis> = {
  // title + end blend bright & dark — the two worlds merging / in conflict
  title: {
    a: [0.03, 0.04, 0.06],
    b: [0.86, 0.62, 0.34],
    c: [0.0, 0.1, 0.06],
    glow: [1.0, 0.6, 0.3],
    glowStr: 0.25,
    grain: 0.06,
    warp: 0.72,
    vig: 0.86,
    aber: 0.32,
  },
  end: {
    a: [0.0, 0.11, 0.06],
    b: [0.9, 0.66, 0.36],
    c: [0.02, 0.02, 0.05],
    glow: [1.0, 0.7, 0.35],
    glowStr: 0.22,
    grain: 0.06,
    warp: 0.66,
    vig: 0.86,
    aber: 0.26,
  },

  // lowercase — bright 3-color gradients
  past: {
    a: [1.0, 0.8, 0.52],
    b: [1.0, 0.93, 0.78],
    c: [1.0, 0.7, 0.66],
    glow: [1.0, 0.92, 0.7],
    glowStr: 0.12,
    grain: 0.024,
    warp: 0.45,
    vig: 0.26,
    aber: 0.05,
  },
  list: {
    a: [1.0, 0.82, 0.55],
    b: [1.0, 0.94, 0.8],
    c: [0.99, 0.74, 0.68],
    glow: [1.0, 0.92, 0.72],
    glowStr: 0.12,
    grain: 0.026,
    warp: 0.45,
    vig: 0.28,
    aber: 0.05,
  },
  lux: {
    a: [1.0, 0.84, 0.5],
    b: [1.0, 0.96, 0.82],
    c: [1.0, 0.74, 0.55],
    glow: [1.0, 0.9, 0.62],
    glowStr: 0.14,
    grain: 0.024,
    warp: 0.5,
    vig: 0.26,
    aber: 0.06,
  },
  question: {
    a: [0.66, 0.84, 1.0],
    b: [0.9, 0.93, 1.0],
    c: [0.82, 0.8, 1.0],
    glow: [0.8, 0.88, 1.0],
    glowStr: 0.12,
    grain: 0.03,
    warp: 0.5,
    vig: 0.3,
    aber: 0.06,
  },
  whisper: {
    a: [1.0, 0.84, 0.84],
    b: [1.0, 0.95, 0.9],
    c: [0.93, 0.86, 0.97],
    glow: [1.0, 0.86, 0.9],
    glowStr: 0.1,
    grain: 0.03,
    warp: 0.45,
    vig: 0.3,
    aber: 0.05,
  },
  echo: {
    a: [1.0, 0.8, 0.52],
    b: [1.0, 0.92, 0.76],
    c: [1.0, 0.7, 0.64],
    glow: [1.0, 0.85, 0.6],
    glowStr: 0.12,
    grain: 0.026,
    warp: 0.45,
    vig: 0.3,
    aber: 0.06,
  },

  // uppercase — darker 3-color gradients
  turn: {
    a: [0.0, 0.0, 0.0],
    b: [0.22, 0.0, 0.0],
    c: [0.06, 0.0, 0.03],
    glow: [1.0, 0.06, 0.06],
    glowStr: 0.5,
    grain: 0.12,
    warp: 0.95,
    vig: 0.92,
    aber: 0.65,
  },
  present: {
    a: [0.02, 0.05, 0.03],
    b: [0.0, 0.12, 0.06],
    c: [0.02, 0.06, 0.1],
    glow: [0.0, 1.0, 0.42],
    glowStr: 0.34,
    grain: 0.09,
    warp: 0.7,
    vig: 0.82,
    aber: 0.4,
  },
  answer: {
    a: [0.02, 0.05, 0.03],
    b: [0.0, 0.14, 0.07],
    c: [0.03, 0.07, 0.12],
    glow: [0.0, 1.0, 0.45],
    glowStr: 0.4,
    grain: 0.1,
    warp: 0.72,
    vig: 0.82,
    aber: 0.45,
  },
};

// ── WebGL shader source ──────────────────────────────────────────────────────
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
uniform vec3 u_a, u_b, u_c, u_glow;
uniform float u_glowStr, u_grain, u_warp, u_vig, u_aber;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*snoise(p); p*=2.03; a*=0.5; } return s; }
float field(vec2 uv,float t){
  vec2 p=uv*2.1;
  vec2 q=vec2(fbm(p+vec2(0.0,t*0.06)), fbm(p+vec2(5.2,1.3)-t*0.05));
  return fbm(p + u_warp*q + vec2(1.7, t*0.04));
}
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
// 3-stop gradient across colors a -> b -> c
vec3 ramp3(float t){
  vec3 lo=mix(u_a,u_b,clamp(t*2.0,0.0,1.0));
  vec3 hi=mix(u_b,u_c,clamp((t-0.5)*2.0,0.0,1.0));
  return mix(lo,hi,step(0.5,t));
}
// flowing gradient position: noise field warped with a soft vertical bias
float gradT(float n, float y){ return clamp(smoothstep(-0.75,0.9,n)*0.74 + (1.0-y)*0.46, 0.0, 1.0); }
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 auv=vec2((uv.x-0.5)*aspect, uv.y-0.5);
  float rad=length(auv);
  vec2 dir=uv-0.5;
  float ab=u_aber*rad*0.05;
  float nr=field(uv+dir*ab,u_time);
  float ng=field(uv,u_time);
  float nb=field(uv-dir*ab,u_time);
  vec3 col=vec3(
    ramp3(gradT(nr,uv.y)).r,
    ramp3(gradT(ng,uv.y)).g,
    ramp3(gradT(nb,uv.y)).b
  );
  vec2 m=vec2((u_mouse.x-0.5)*aspect, u_mouse.y-0.5);
  col += u_glow*u_glowStr*exp(-distance(auv,m)*4.5);
  col += u_glow*u_glowStr*0.22*exp(-rad*3.0)*(0.6+0.4*sin(u_time*0.5));
  col *= mix(1.0, smoothstep(1.15,0.2,rad), u_vig);
  col += (hash(uv*u_res+fract(u_time)*97.0)-0.5)*u_grain;
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Generative ambient score (Web Audio, off by default) ─────────────────────
type Audio = {
  ctx: AudioContext;
  master: GainNode;
  setMood: (m: Mood) => void;
  dispose: () => void;
};
// Two crossfading "tracks": a light jazzy pad+arp for lowercase moods, and a
// dark drone for the uppercase ones. The case flip swaps tracks.
const isLightMood = (m: Mood) =>
  m !== "turn" && m !== "present" && m !== "answer";
function buildAudio(): Audio | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // ---------- DARK track — dry, ominous drone ----------
    const darkGain = ctx.createGain();
    darkGain.gain.value = 1.0;
    darkGain.connect(master);
    const darkFilter = ctx.createBiquadFilter();
    darkFilter.type = "lowpass";
    darkFilter.frequency.value = 700;
    darkFilter.Q.value = 7;
    darkFilter.connect(darkGain);
    const dlfo = ctx.createOscillator();
    const dlfoGain = ctx.createGain();
    dlfo.frequency.value = 0.06;
    dlfoGain.gain.value = 240;
    dlfo.connect(dlfoGain).connect(darkFilter.frequency);
    dlfo.start();
    const darkOscs = [41, 41.2, 61.5].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "sine" : "sawtooth";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.5 : 0.2;
      o.connect(g).connect(darkFilter);
      o.start();
      return o;
    });

    // ---------- LIGHT track — jazzy Cmaj7 pad + swung arpeggio, with delay ----------
    const lightGain = ctx.createGain();
    lightGain.gain.value = 0.0001;
    const lightBus = ctx.createGain();
    lightBus.gain.value = 1.0;
    lightGain.connect(lightBus);
    lightBus.connect(master);
    // a touch of feedback-delay space, light track only
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.26;
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    lightBus.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);

    const lightFilter = ctx.createBiquadFilter();
    lightFilter.type = "lowpass";
    lightFilter.frequency.value = 2900;
    lightFilter.Q.value = 0.6;
    lightFilter.connect(lightGain);
    const llfo = ctx.createOscillator();
    const llfoGain = ctx.createGain();
    llfo.frequency.value = 0.12;
    llfoGain.gain.value = 500;
    llfo.connect(llfoGain).connect(lightFilter.frequency);
    llfo.start();

    // (no sustained pad — the drone read as "dark"; the arp + walking bass carry
    // the harmony instead, keeping the lowercase track light and airy)

    // swung arpeggio over the chord (a little lounge noodle, with a rest)
    const arpGain = ctx.createGain();
    arpGain.gain.value = 1.0;
    arpGain.connect(lightFilter);
    // bouncy, cheerful noodle over C6/9
    const arpNotes: (number | null)[] = [
      261.63, 329.63, 392.0, 440.0, 392.0, 493.88, 587.33, 493.88, 440.0, 392.0,
      329.63, 293.66, 329.63, 392.0, 440.0, 587.33,
    ];
    let step = 0;
    let nextTime = ctx.currentTime + 0.25;
    let swing = true;
    let lightActive = false;
    // steady (non-swung) grid for the dark/uppercase drum beat
    let darkNext = ctx.currentTime + 0.25;
    let darkStep = 0;
    const scheduleNote = (freq: number | null, t: number) => {
      if (freq == null) return;
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.085, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g).connect(arpGain);
      o.start(t);
      o.stop(t + 0.46);
    };
    // soft walking bass (I - vi - IV - V): C2 A1 F2 G2
    const bassNotes = [65.41, 55.0, 87.31, 98.0];
    const scheduleBass = (freq: number, t: number) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g).connect(lightFilter);
      o.start(t);
      o.stop(t + 0.75);
    };
    // brushed-drum tick — filtered noise burst, swung ride feel with a backbeat accent
    const noiseBuf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * 0.3),
      ctx.sampleRate
    );
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const scheduleTick = (t: number, accent: boolean) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = accent ? 5200 : 7200;
      bp.Q.value = 0.8;
      const g = ctx.createGain();
      const peak = accent ? 0.05 : 0.026;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.14 : 0.07));
      src.connect(bp).connect(g).connect(lightGain); // bypass the lowpass to keep brush highs
      src.start(t);
      src.stop(t + 0.2);
    };
    // ---- dark/uppercase drum kit (synthesized) ----
    const scheduleKick = (t: number) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.62, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(darkGain);
      o.start(t);
      o.stop(t + 0.3);
    };
    const scheduleSnare = (t: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1900;
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.34, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      src.connect(bp).connect(g).connect(darkGain);
      src.start(t);
      src.stop(t + 0.2);
    };
    const scheduleHat = (t: number, open: boolean) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 8200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(open ? 0.09 : 0.06, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.11 : 0.04));
      src.connect(hp).connect(g).connect(darkGain);
      src.start(t);
      src.stop(t + 0.16);
    };
    const lookahead = () => {
      if (ctx.state === "closed") return;
      const horizon = ctx.currentTime + 0.12;
      // light/lowercase grid (swung jazz)
      while (nextTime < horizon) {
        if (lightActive) {
          scheduleNote(arpNotes[step % arpNotes.length], nextTime);
          scheduleTick(nextTime, step % 4 === 2);
          if (step % 4 === 0)
            scheduleBass(
              bassNotes[Math.floor(step / 4) % bassNotes.length],
              nextTime
            );
        }
        nextTime += swing ? 0.26 : 0.155; // swung eighths
        swing = !swing;
        step++;
      }
      // dark/uppercase grid (driving beat: four-on-floor kick, backbeat snare, eighth hats)
      while (darkNext < horizon) {
        if (!lightActive) {
          if (darkStep % 2 === 0) scheduleKick(darkNext);
          if (darkStep % 8 === 2 || darkStep % 8 === 6) scheduleSnare(darkNext);
          scheduleHat(darkNext, darkStep % 2 === 1);
        }
        darkNext += 0.26; // steady eighths
        darkStep++;
      }
    };
    const interval = setInterval(lookahead, 25);

    const setMood = (m: Mood) => {
      const now = ctx.currentTime;
      const light = isLightMood(m);
      lightActive = light;
      darkGain.gain.setTargetAtTime(light ? 0.0001 : 1.0, now, 0.7);
      lightGain.gain.setTargetAtTime(light ? 1.0 : 0.0001, now, 0.7);
      if (!light) {
        const base = m === "turn" ? 41 : 49;
        darkOscs[0].frequency.setTargetAtTime(base, now, 1.2);
        darkOscs[1].frequency.setTargetAtTime(base * 1.006, now, 1.2);
        darkOscs[2].frequency.setTargetAtTime(base * 1.5, now, 1.2);
        darkFilter.frequency.setTargetAtTime(
          m === "turn" ? 620 : 920,
          now,
          1.4
        );
      }
    };

    return {
      ctx,
      master,
      setMood,
      dispose: () => {
        clearInterval(interval);
        try {
          ctx.close();
        } catch {
          /* noop */
        }
      },
    };
  } catch {
    return null;
  }
}

export default function StrangeCaseExperience() {
  const router = useRouter();
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [showHint, setShowHint] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStep = useRef(0);
  const moodRef = useRef<Mood>("title");
  const audioRef = useRef<Audio | null>(null);

  const total = BEATS.length;
  const beat = BEATS[cur];
  const mood = moodOf(beat);
  moodRef.current = mood;

  const armHint = useCallback(() => {
    setShowHint(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(true), 4200);
  }, []);

  const step = useCallback(
    (delta: 1 | -1) => {
      const now = performance.now();
      // Advancing faster than the crossfade can resolve → clean hard cut, no overlap.
      const fast = now - lastStep.current < 340;
      lastStep.current = now;
      setCur((i) => {
        const next = Math.min(Math.max(i + delta, 0), total - 1);
        if (next !== i) {
          setDir(delta);
          if (prevTimer.current) clearTimeout(prevTimer.current);
          if (fast) {
            setPrev(null); // drop any outgoing layer immediately
          } else {
            setPrev(i);
            prevTimer.current = setTimeout(() => setPrev(null), 560);
          }
        }
        return next;
      });
      armHint();
    },
    [total, armHint]
  );

  const exit = useCallback(() => router.back(), [router]);

  // touch device? drives the hint copy + cuts superfluous animation to stay light
  useEffect(() => {
    setIsMobile(
      window.matchMedia("(max-width: 767px), (pointer: coarse)").matches
    );
  }, []);

  // mood → audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.setMood(mood);
  }, [mood]);

  // sound toggle
  useEffect(() => {
    if (soundOn) {
      if (!audioRef.current) {
        audioRef.current = buildAudio();
        if (audioRef.current) audioRef.current.setMood(moodRef.current);
      }
      const a = audioRef.current;
      if (a) {
        if (a.ctx.state === "suspended") a.ctx.resume();
        a.master.gain.setTargetAtTime(0.18, a.ctx.currentTime, 1.2);
      }
    } else if (audioRef.current) {
      const a = audioRef.current;
      a.master.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.4);
    }
  }, [soundOn]);

  // hint lifecycle
  useEffect(() => {
    armHint();
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
      if (prevTimer.current) clearTimeout(prevTimer.current);
      if (audioRef.current) audioRef.current.dispose();
    };
  }, [armHint]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, exit]);

  // ── WebGL + parallax + cursor render loop ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const mobile = window.matchMedia(
      "(max-width: 767px), (pointer: coarse)"
    ).matches;

    const gl = (canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      root.style.background = "#070707";
      return;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const pLoc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("u_res"),
      uTime = U("u_time"),
      uMouse = U("u_mouse");
    const uA = U("u_a"),
      uB = U("u_b"),
      uC = U("u_c"),
      uGlow = U("u_glow");
    const uGlowStr = U("u_glowStr"),
      uGrain = U("u_grain"),
      uWarp = U("u_warp"),
      uVig = U("u_vig"),
      uAber = U("u_aber");

    const QUALITY = mobile ? 0.5 : 0.7; // lower internal resolution on phones
    const resize = () => {
      const w = Math.min(root.clientWidth, 1700);
      const h = Math.min(root.clientHeight, 1700);
      canvas.width = Math.max(2, Math.round(w * QUALITY));
      canvas.height = Math.max(2, Math.round(h * QUALITY));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // live (lerped) uniform state, seeded to title
    const v = VIS.title;
    const s = {
      a: [...v.a],
      b: [...v.b],
      c: [...v.c],
      glow: [...v.glow],
      glowStr: v.glowStr,
      grain: v.grain,
      warp: v.warp,
      vig: v.vig,
      aber: v.aber,
      mx: 0.5,
      my: 0.55,
      tmx: 0.5,
      tmy: 0.55,
    };

    const onMove = (e: PointerEvent) => {
      s.tmx = e.clientX / window.innerWidth;
      s.tmy = 1 - e.clientY / window.innerHeight;
      if (fine && cursorRef.current) {
        cursorRef.current.style.setProperty("--cx", `${e.clientX}px`);
        cursorRef.current.style.setProperty("--cy", `${e.clientY}px`);
        cursorRef.current.style.opacity = "1";
      }
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    let fc = 0;
    const start = performance.now();
    let last = start;
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = reduce ? 1 : 1 - Math.exp(-dt * 2.4);
      const tgt = VIS[moodRef.current];
      for (let i = 0; i < 3; i++) {
        s.a[i] = lerp(s.a[i], tgt.a[i], k);
        s.b[i] = lerp(s.b[i], tgt.b[i], k);
        s.c[i] = lerp(s.c[i], tgt.c[i], k);
        s.glow[i] = lerp(s.glow[i], tgt.glow[i], k);
      }
      s.glowStr = lerp(s.glowStr, tgt.glowStr, k);
      s.grain = lerp(s.grain, tgt.grain, k);
      s.warp = lerp(s.warp, tgt.warp, k);
      s.vig = lerp(s.vig, tgt.vig, k);
      s.aber = lerp(s.aber, tgt.aber, k);
      s.mx = lerp(s.mx, s.tmx, 1 - Math.exp(-dt * 6));
      s.my = lerp(s.my, s.tmy, 1 - Math.exp(-dt * 6));

      // parallax depth on the stage
      root.style.setProperty("--mx", (s.mx - 0.5).toFixed(4));
      root.style.setProperty("--my", (s.my - 0.5).toFixed(4));

      // on mobile, draw every other frame (~30fps) — halves shader cost
      if (!mobile || fc++ % 2 === 0) {
        gl.uniform1f(uTime, reduce ? 0 : t);
        gl.uniform2f(uMouse, s.mx, s.my);
        gl.uniform3f(uA, s.a[0], s.a[1], s.a[2]);
        gl.uniform3f(uB, s.b[0], s.b[1], s.b[2]);
        gl.uniform3f(uC, s.c[0], s.c[1], s.c[2]);
        gl.uniform3f(uGlow, s.glow[0], s.glow[1], s.glow[2]);
        gl.uniform1f(uGlowStr, s.glowStr);
        gl.uniform1f(uGrain, s.grain);
        gl.uniform1f(uWarp, s.warp);
        gl.uniform1f(uVig, s.vig);
        gl.uniform1f(uAber, s.aber);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    if (reduce) frame(start); // one static paint

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, []);

  const onTouchStartY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    onTouchStartY.current = e.changedTouches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (onTouchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - onTouchStartY.current;
    onTouchStartY.current = null;
    if (dy < -45) {
      e.preventDefault();
      step(1);
    } else if (dy > 45) {
      e.preventDefault();
      step(-1);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`sce-root atmo-${mood} ${isMobile ? "is-mobile" : ""}`}
      onClick={() => step(1)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="presentation"
    >
      <canvas ref={canvasRef} className="sce-canvas" aria-hidden="true" />
      <div className="sce-scrim" />
      <div className="sce-scan" />

      {/* exit */}
      <button
        className="sce-icon sce-back"
        onClick={(e) => {
          e.stopPropagation();
          exit();
        }}
        aria-label="Exit reading experience"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* sound */}
      <button
        className="sce-icon sce-sound"
        onClick={(e) => {
          e.stopPropagation();
          setSoundOn((v) => !v);
        }}
        aria-label={soundOn ? "Mute score" : "Play score"}
      >
        {soundOn ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 010 7M18.5 6a8 8 0 010 12" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M22 9l-6 6M16 9l6 6" />
          </svg>
        )}
      </button>

      {/* beat stack (exit + enter layers) */}
      <div className="sce-perspective">
        {prev !== null && (
          <BeatView beat={BEATS[prev]} phase="exit" dir={dir} />
        )}
        <BeatView
          beat={beat}
          phase="enter"
          dir={dir}
          onReplay={() => {
            setCur(0);
            armHint();
          }}
          onExit={exit}
        />
      </div>

      {/* affordances */}
      <div className={`sce-hint ${showHint ? "show" : ""}`}>
        {isMobile ? "swipe to continue" : "tap or use arrows"}
      </div>
      <div
        className="sce-progress"
        style={{ width: `${((cur + 1) / total) * 100}%` }}
      />
      <div ref={cursorRef} className="sce-cursor" aria-hidden="true">
        <span className="sce-cursor-dot" />
        <span className="sce-cursor-ring" />
      </div>

      {/* Plain global <style> (not styled-jsx) — the interpolated STYLES blob
          didn't inject reliably through styled-jsx in the production build. */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

// ── A single beat (enter or exit layer) ──────────────────────────────────────
function BeatView({
  beat,
  phase,
  dir,
  onReplay,
  onExit,
}: {
  beat: Beat;
  phase: "enter" | "exit";
  dir: 1 | -1;
  onReplay?: () => void;
  onExit?: () => void;
}) {
  if (beat.kind === "photo") {
    return <PhotoBeat slot={beat.slot} phase={phase} />;
  }
  if (beat.kind === "bullet") {
    return (
      <BulletBeat
        n={beat.n}
        img={beat.img}
        lines={beat.lines}
        phase={phase}
        pos={beat.pos}
      />
    );
  }
  const beatMood = moodOf(beat);
  const bg = beat.kind === "text" ? beat.bg : undefined;
  const collage = beat.kind === "text" ? beat.collage : undefined;
  const hasBg = !!(bg || collage);
  return (
    <div
      className={`sce-stage m-${beatMood} ${phase} dir-${dir} ${hasBg ? "has-bg" : ""}`}
    >
      {collage ? (
        <div className="sce-collage">
          {collage.map((src) => (
            <div
              key={src}
              className="sce-collage-cell"
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
      ) : bg ? (
        <div
          className="sce-stage-bg"
          style={{ backgroundImage: `url(${bg})` }}
        />
      ) : null}
      {hasBg && <div className="sce-stage-bg-scrim" />}
      <div className="sce-beat">
        {beat.kind === "title" && (
          <>
            <div className="sce-eyebrow">a riff in motion</div>
            <h1 className="sce-title">tHe StRaNgE cAsE</h1>
            <p className="sce-subtitle">a psychological self-examination</p>
          </>
        )}

        {beat.kind === "text" && (
          <>
            {beat.listNum && <div className="sce-listnum">{beat.listNum}</div>}
            <Reveal lines={beat.lines} long={!!beat.long} phase={phase} />
          </>
        )}

        {beat.kind === "end" && (
          <>
            <div className="sce-fin">fin.</div>
            <h2 className="sce-endtitle">tHe StRaNgE cAsE</h2>
            <div className="sce-endactions">
              <button
                className="sce-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReplay?.();
                }}
              >
                read again
              </button>
              <button
                className="sce-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onExit?.();
                }}
              >
                leave
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Per-character kinetic typography ─────────────────────────────────────────
function Reveal({
  lines,
  long,
  phase,
}: {
  lines: string[];
  long: boolean;
  phase: "enter" | "exit";
}) {
  const lgap = long ? "90ms" : "150ms";
  const cgap = long ? "7ms" : "16ms";
  return (
    <div
      className={`sce-text ${long ? "is-long" : ""}`}
      style={
        {
          ["--lgap" as string]: lgap,
          ["--cgap" as string]: cgap,
        } as React.CSSProperties
      }
    >
      {lines.map((line, li) => (
        <span
          className="sce-line"
          key={line}
          style={{ ["--li" as string]: li } as React.CSSProperties}
        >
          {splitWords(line).map((word, wi) =>
            word === " " ? (
              <span key={`s${wi}`} className="sce-space">
                &nbsp;
              </span>
            ) : (
              <span key={`w${wi}`} className="sce-word">
                {Array.from(word).map((ch, ci) => (
                  <span
                    key={ci}
                    className="sce-char"
                    style={
                      {
                        ["--ci" as string]: wordOffset(line, wi) + ci,
                      } as React.CSSProperties
                    }
                  >
                    {ch}
                  </span>
                ))}
              </span>
            )
          )}
        </span>
      ))}
      {/* phase is encoded on the parent stage (.enter/.exit) for animation routing */}
      <span hidden>{phase}</span>
    </div>
  );
}

// split into words but keep spaces as their own tokens
function splitWords(line: string): string[] {
  return line
    .split(/(\s+)/)
    .map((t) => (/^\s+$/.test(t) ? " " : t))
    .filter((t) => t !== "");
}
// running char index up to word wi (so the stagger flows across the whole line)
function wordOffset(line: string, wi: number): number {
  const toks = splitWords(line);
  let n = 0;
  for (let i = 0; i < wi; i++) n += toks[i] === " " ? 1 : toks[i].length;
  return n;
}

// ── Enumerated "specifics" beat — image behind, clear list progress ──────────
function BulletBeat({
  n,
  img,
  lines,
  phase,
  pos,
}: {
  n: number;
  img: string | null;
  lines: string[];
  phase: "enter" | "exit";
  pos?: string;
}) {
  const long = lines.join(" ").length > 80;
  return (
    <div className={`sce-bullet ${phase}`}>
      {img ? (
        <div
          className="sce-bullet-bg"
          style={{
            backgroundImage: `url(${img})`,
            backgroundPosition: pos ?? "center",
          }}
        />
      ) : (
        <div className="sce-bullet-bg sce-bullet-bg-blank" />
      )}
      <div className="sce-bullet-overlay" />

      <div className="sce-bullet-head">
        <div className="sce-bullet-ticks" aria-hidden="true">
          {Array.from({ length: BULLET_TOTAL }, (_, i) => (
            <span
              key={`tick-${i}`}
              className={`sce-tick ${i < n ? "on" : ""} ${i === n - 1 ? "cur" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="sce-bullet-body">
        <div className="sce-bullet-num">
          <span className="big">{String(n).padStart(2, "0")}</span>
          <span className="sub">/ {String(BULLET_TOTAL).padStart(2, "0")}</span>
        </div>
        <div className={`sce-bullet-text ${long ? "is-long" : ""}`}>
          <Reveal lines={lines} long={long} phase={phase} />
        </div>
      </div>
    </div>
  );
}

// ── Full-bleed cinematic photo beat ──────────────────────────────────────────
function PhotoBeat({ slot, phase }: { slot: string; phase: "enter" | "exit" }) {
  const photo = PHOTOS[slot];
  return (
    <div className={`sce-photo ${phase}`}>
      <div className="sce-bar sce-bar-top" />
      <div className="sce-bar sce-bar-bottom" />
      {photo ? (
        <img className="sce-photo-img" src={photo.src} alt={photo.alt} />
      ) : (
        <div className="sce-photo-slot">
          <div className="sce-photo-slot-inner">
            <div className="sce-photo-slot-tag">photo slot</div>
            <div className="sce-photo-slot-name">{slot}</div>
            <div className="sce-photo-slot-hint">
              drop an image here · tap to continue
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles (global so styled-jsx keyframes resolve cleanly) ──────────────────
const STYLES = `
.sce-root{position:fixed;inset:0;z-index:60;overflow:hidden;cursor:none;user-select:none;-webkit-tap-highlight-color:transparent;background:#070707;--mx:0;--my:0;}
@media (pointer:coarse){.sce-root{cursor:pointer;}}
.sce-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}
.sce-scrim{position:absolute;inset:0;pointer-events:none;transition:background 1100ms ease;}
.atmo-title .sce-scrim,.atmo-end .sce-scrim{background:radial-gradient(72% 62% at 50% 50%,rgba(0,0,0,0.28),rgba(0,0,0,0.62));}
.atmo-past .sce-scrim,.atmo-list .sce-scrim,.atmo-lux .sce-scrim,.atmo-question .sce-scrim,.atmo-whisper .sce-scrim{background:radial-gradient(60% 54% at 50% 46%,rgba(255,252,245,0.5),rgba(255,252,245,0.0) 76%);}
.atmo-turn .sce-scrim,.atmo-present .sce-scrim,.atmo-answer .sce-scrim,.atmo-echo .sce-scrim{background:radial-gradient(60% 55% at 50% 50%,rgba(0,0,0,0.15),rgba(0,0,0,0.62));}

.sce-scan{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:overlay;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.5) 0px,rgba(0,0,0,0.5) 1px,transparent 2px,transparent 3px);transition:opacity 900ms ease;}
.atmo-present .sce-scan,.atmo-answer .sce-scan,.atmo-turn .sce-scan{opacity:0.18;}

.sce-icon{position:absolute;top:clamp(14px,3vw,26px);z-index:9;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:none;background:transparent;color:#fff;mix-blend-mode:difference;cursor:pointer;opacity:0.7;transition:opacity .2s ease,transform .2s ease;}
.sce-icon:hover{opacity:1;}
.sce-back{left:clamp(14px,3vw,26px);}
.sce-back:hover{transform:translateX(-3px);}
.sce-sound{right:clamp(14px,3vw,26px);}

.sce-act{position:absolute;left:clamp(16px,3vw,30px);bottom:clamp(60px,12vh,110px);z-index:7;writing-mode:vertical-rl;font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:11px;letter-spacing:0.34em;text-transform:lowercase;color:#fff;mix-blend-mode:difference;opacity:0.5;animation:sceActIn 1400ms ease both;}
@keyframes sceActIn{from{opacity:0;transform:translateY(14px);}to{opacity:0.5;transform:none;}}

.sce-perspective{position:absolute;inset:0;perspective:1400px;perspective-origin:50% 50%;z-index:4;}
.sce-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:clamp(30px,6vw,110px);box-sizing:border-box;transform-style:preserve-3d;}
.sce-stage.enter,.sce-photo.enter{z-index:2;}
.sce-stage.exit,.sce-photo.exit{z-index:1;pointer-events:none;}
.sce-beat{position:relative;z-index:2;width:100%;max-width:880px;text-align:center;transform:rotateX(calc(var(--my)*-3.5deg)) rotateY(calc(var(--mx)*3.5deg)) translateX(calc(var(--mx)*14px)) translateY(calc(var(--my)*-14px));transition:transform .25s ease-out;}

/* in-text background photo (the two "exhilarating" beats): full-bleed cover on
   mobile (portrait), fully-contained on desktop so the whole photo is visible. */
.sce-stage-bg{position:absolute;inset:0;z-index:0;background-position:center;background-repeat:no-repeat;background-size:cover;transform:scale(1.05) translate(calc(var(--mx)*-12px),calc(var(--my)*12px));animation:kenburns 18s ease-out both;}
.sce-stage-bg-scrim{position:absolute;inset:0;z-index:1;background:radial-gradient(64% 64% at 50% 50%,rgba(0,0,0,0.40),rgba(0,0,0,0.76));}
@media (min-width:768px){.sce-stage-bg{background-size:contain;transform:none;animation:none;}}
/* responsive photo collage (the two "exhilarating" beats): the portrait 2x3
   grid the photo was made in on mobile, reflowed to a 3x2 landscape on desktop. */
.sce-collage{position:absolute;inset:0;z-index:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:2px;background:#000;transform:scale(1.05) translate(calc(var(--mx)*-14px),calc(var(--my)*14px));transition:transform .3s ease-out;}
.sce-collage-cell{background-size:cover;background-position:center;}
@media (min-width:768px){.sce-collage{grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr;}}
/* In a preserve-3d stage, z-index is ignored — the parallax-tilted text plane
   would clip through the flat scrim at z=0. Lift the text forward in Z so the
   whole tilt stays in front of the scrim. */
.sce-stage.has-bg .sce-beat{transform:rotateX(calc(var(--my)*-3.5deg)) rotateY(calc(var(--mx)*3.5deg)) translateX(calc(var(--mx)*14px)) translateY(calc(var(--my)*-14px)) translateZ(60px);}

.sce-char{display:inline-block;will-change:transform,opacity,filter;}
.sce-word{display:inline-block;white-space:nowrap;}
.sce-space{display:inline;}
.sce-line{display:block;}

/* ENTER routes by the layer's OWN mood (m-* + .enter both live on the stage,
   so an exiting layer never inherits the incoming section's reveal). Default rise. */
.enter .sce-char{animation:charUp .8s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--li)*var(--lgap) + var(--ci)*var(--cgap));}
.m-present.enter .sce-char,.m-answer.enter .sce-char{animation-name:charGlitch;animation-duration:.62s;}
.m-turn.enter .sce-char{animation-name:charSlam;animation-duration:.9s;}
.m-question.enter .sce-char,.m-whisper.enter .sce-char,.m-echo.enter .sce-char{animation-name:charSoft;animation-duration:1s;}
/* EXIT is block-level (whole beat as one unit) — fast + predictable, never
   staggers past the layer's lifetime when advancing quickly. */
.sce-stage.exit .sce-beat{animation:blockOut .5s cubic-bezier(.4,0,1,1) both;}

@keyframes charUp{0%{opacity:0;transform:translateY(0.95em) rotate(4deg) scale(.96);filter:blur(14px);}60%{filter:blur(0);}100%{opacity:1;transform:none;filter:blur(0);}}
@keyframes charGlitch{0%{opacity:0;transform:translateX(-0.45em) skewX(20deg);filter:blur(12px);}45%{opacity:1;}62%{transform:translateX(0.05em) skewX(0);}100%{opacity:1;transform:none;filter:blur(0);}}
@keyframes charSlam{0%{opacity:0;transform:scale(2.6);filter:blur(28px);}70%{opacity:1;}100%{opacity:1;transform:none;filter:blur(0);}}
@keyframes charSoft{0%{opacity:0;transform:translateY(0.3em);filter:blur(13px);}100%{opacity:1;transform:none;filter:blur(0);}}
@keyframes blockOut{0%{opacity:1;}100%{opacity:0;transform:translateY(-0.32em) scale(1.02);filter:blur(14px);}}

/* title */
.sce-eyebrow{font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:12px;letter-spacing:0.42em;text-transform:uppercase;color:rgba(0,255,102,0.72);margin-bottom:clamp(20px,5vh,40px);animation:fadeUp 1s both;}
.sce-title{font-family:var(--font-playfair),Georgia,serif;color:#f6f2e9;font-size:clamp(46px,11vw,108px);line-height:1;margin:0;font-weight:400;animation:fadeUp 1.2s both;animation-delay:.12s;text-shadow:0 0 60px rgba(0,0,0,0.5);}
.sce-subtitle{font-family:var(--font-playfair),Georgia,serif;color:rgba(246,242,233,0.6);font-size:clamp(16px,3.4vw,25px);margin-top:clamp(16px,3vh,28px);animation:fadeUp 1.2s both;animation-delay:.34s;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px);filter:blur(8px);}to{opacity:1;transform:none;filter:blur(0);}}

/* past / list / lux */
.m-past .sce-text,.m-list .sce-text,.m-lux .sce-text{font-family:var(--font-playfair),Georgia,serif;color:#211c14;font-weight:400;font-size:clamp(24px,4.6vw,46px);line-height:1.34;letter-spacing:-0.01em;}
.m-past .sce-text.is-long,.m-list .sce-text.is-long,.m-lux .sce-text.is-long{font-size:clamp(18px,3.2vw,31px);line-height:1.5;}
.sce-listnum{font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:13px;letter-spacing:0.34em;color:rgba(33,28,20,0.45);margin-bottom:clamp(20px,4vh,34px);animation:fadeUp .7s both;}

/* turn */
.m-turn .sce-text{font-family:var(--font-source-code-pro),ui-monospace,monospace;color:#fff;font-weight:500;font-size:clamp(25px,5vw,52px);line-height:1.24;letter-spacing:0.01em;text-shadow:0 0 34px rgba(220,38,38,0.4);}

/* present / answer */
.m-present .sce-text,.m-answer .sce-text{font-family:var(--font-source-code-pro),ui-monospace,monospace;color:#e9ffe9;font-weight:500;font-size:clamp(21px,4vw,40px);line-height:1.4;letter-spacing:0.01em;text-shadow:0 0 22px rgba(0,255,102,0.2);}
.m-present .sce-text.is-long,.m-answer .sce-text.is-long{font-size:clamp(17px,3vw,29px);line-height:1.5;}
.m-present .sce-line,.m-answer .sce-line{margin:0.16em 0;}

/* question / whisper / echo */
.m-question .sce-text{font-family:var(--font-playfair),Georgia,serif;color:#23262e;font-weight:400;font-size:clamp(23px,4.7vw,44px);line-height:1.3;}
.m-whisper .sce-text{font-family:var(--font-playfair),Georgia,serif;color:#2a241c;font-size:clamp(20px,3.7vw,31px);letter-spacing:0.02em;}
.m-echo .sce-text{font-family:var(--font-playfair),Georgia,serif;color:#f1e6d3;font-size:clamp(21px,3.9vw,35px);line-height:1.5;}

/* end */
.sce-fin{font-family:var(--font-source-code-pro),ui-monospace,monospace;color:rgba(0,255,102,0.72);font-size:13px;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:24px;animation:fadeUp .8s both;}
.sce-endtitle{font-family:var(--font-playfair),Georgia,serif;color:#f6f2e9;font-size:clamp(34px,8vw,74px);margin:0 0 clamp(32px,7vh,56px);font-weight:400;animation:fadeUp 1s both;animation-delay:.12s;}
.sce-endactions{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;animation:fadeUp 1s both;animation-delay:.34s;}
.sce-btn{font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#f6f2e9;background:transparent;border:1.5px solid rgba(246,242,233,0.5);padding:14px 26px;cursor:pointer;transition:all .2s ease;}
.sce-btn:hover{background:#f6f2e9;color:#000;border-color:#f6f2e9;}

/* affordances */
.sce-hint{position:absolute;left:50%;bottom:clamp(22px,5vh,44px);transform:translateX(-50%);z-index:6;font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#fff;mix-blend-mode:difference;opacity:0;pointer-events:none;transition:opacity .8s ease;}
.sce-hint.show{opacity:0.5;animation:scePulse 2.4s ease-in-out infinite;}
@keyframes scePulse{0%,100%{opacity:0.22;}50%{opacity:0.55;}}
.sce-progress{position:absolute;left:0;bottom:0;height:2px;background:#fff;mix-blend-mode:difference;z-index:6;transition:width .52s cubic-bezier(.2,.7,.2,1);}

/* photo */
.sce-photo{position:absolute;inset:0;z-index:4;overflow:hidden;animation:photoIn 1.1s ease both;}
.sce-photo.exit{animation:photoOut .6s ease both;}
@keyframes photoIn{from{opacity:0;}to{opacity:1;}}
@keyframes photoOut{from{opacity:1;}to{opacity:0;}}
.sce-photo-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.05) translate(calc(var(--mx)*-18px),calc(var(--my)*18px));animation:kenburns 16s ease-out both;}
@keyframes kenburns{from{transform:scale(1.05);}to{transform:scale(1.16);}}
.sce-bar{position:absolute;left:0;right:0;height:11vh;background:#000;z-index:5;animation:barIn 1.1s cubic-bezier(.2,.7,.2,1) both;}
.sce-bar-top{top:0;transform-origin:top;}
.sce-bar-bottom{bottom:0;transform-origin:bottom;}
@keyframes barIn{from{transform:scaleY(0);}to{transform:scaleY(1);}}
.sce-photo-slot{position:absolute;inset:11vh clamp(20px,5vw,56px);display:flex;align-items:center;justify-content:center;border:2px dashed rgba(255,255,255,0.22);}
.sce-photo-slot-inner{text-align:center;}
.sce-photo-slot-tag{font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:11px;letter-spacing:0.34em;text-transform:uppercase;color:rgba(255,255,255,0.42);}
.sce-photo-slot-name{font-family:var(--font-playfair),Georgia,serif;font-style:italic;font-size:clamp(28px,7vw,56px);color:rgba(255,255,255,0.85);margin:14px 0 16px;}
.sce-photo-slot-hint{font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.32);}

/* bullets — enumerated "specifics" over imagery */
.sce-bullet{position:absolute;inset:0;z-index:4;overflow:hidden;animation:photoIn 1s ease both;}
.sce-bullet.exit{animation:photoOut .55s ease both;}
.sce-bullet-bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.06) translate(calc(var(--mx)*-16px),calc(var(--my)*16px));animation:kenburns 18s ease-out both;}
.sce-bullet-bg-blank{background:radial-gradient(120% 95% at 50% 0%,#2b2118,#0e0a06 72%);animation:none;transform:none;}
.sce-bullet-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.62) 0%,rgba(0,0,0,0.22) 30%,rgba(0,0,0,0.32) 60%,rgba(0,0,0,0.86) 100%);}
.sce-bullet-head{position:absolute;top:clamp(64px,11vh,108px);left:0;right:0;z-index:2;display:flex;flex-direction:column;align-items:center;gap:13px;animation:fadeUp .8s both;}
.sce-bullet-label{font-family:var(--font-source-code-pro),ui-monospace,monospace;font-size:12px;letter-spacing:0.44em;text-transform:uppercase;color:rgba(255,255,255,0.72);}
.sce-bullet-ticks{display:flex;gap:clamp(5px,1.4vw,8px);}
.sce-tick{width:clamp(15px,4.6vw,26px);height:3px;background:rgba(255,255,255,0.24);transition:background .45s ease,transform .45s ease;transform-origin:center;}
.sce-tick.on{background:rgba(255,255,255,0.92);}
.sce-tick.cur{background:#fff;transform:scaleY(2.4);box-shadow:0 0 10px rgba(255,255,255,0.7);}
.sce-bullet-body{position:absolute;left:0;right:0;bottom:clamp(58px,13vh,124px);z-index:2;padding:0 clamp(28px,7vw,90px);display:flex;flex-direction:column;align-items:flex-start;gap:clamp(12px,3vh,24px);text-align:left;}
.sce-bullet-num{font-family:var(--font-source-code-pro),ui-monospace,monospace;color:#fff;display:flex;align-items:baseline;gap:10px;text-shadow:0 2px 20px rgba(0,0,0,0.55);}
.sce-bullet-num .big{font-size:clamp(38px,8.5vw,78px);font-weight:600;letter-spacing:-0.02em;line-height:1;}
.sce-bullet-num .sub{font-size:clamp(12px,2vw,16px);letter-spacing:0.3em;color:rgba(255,255,255,0.62);}
.sce-bullet-text{font-family:var(--font-playfair),Georgia,serif;color:#f6efe2;font-weight:400;font-size:clamp(22px,3.9vw,40px);line-height:1.32;max-width:920px;text-shadow:0 2px 30px rgba(0,0,0,0.72);}
.sce-bullet-text.is-long{font-size:clamp(18px,3vw,30px);line-height:1.42;}
.sce-bullet-text .sce-text{font-family:inherit;color:inherit;}

/* custom cursor */
.sce-cursor{position:fixed;left:0;top:0;z-index:20;pointer-events:none;opacity:0;transform:translate(var(--cx,-100px),var(--cy,-100px));mix-blend-mode:difference;transition:opacity .3s ease;}
.sce-cursor-dot{position:absolute;width:7px;height:7px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);}
.sce-cursor-ring{position:absolute;width:34px;height:34px;border:1.5px solid rgba(255,255,255,0.8);border-radius:50%;transform:translate(-50%,-50%);animation:ringBreath 3s ease-in-out infinite;}
@keyframes ringBreath{0%,100%{width:30px;height:30px;opacity:.7;}50%{width:40px;height:40px;opacity:.35;}}

/* mobile: strip GPU-heavy continuous motion + per-char blur to stay smooth */
.is-mobile .sce-bullet-bg,.is-mobile .sce-photo-img,.is-mobile .sce-stage-bg{animation:none !important;}
.is-mobile .sce-collage,.is-mobile .sce-stage-bg{transform:none !important;}
.is-mobile .enter .sce-char{animation-name:charFadeM !important;animation-duration:.5s !important;}
@keyframes charFadeM{from{opacity:0;transform:translateY(0.3em);}to{opacity:1;transform:none;}}

@media (prefers-reduced-motion:reduce){
  .sce-char,.sce-title,.sce-subtitle,.sce-eyebrow,.sce-endtitle,.sce-endactions,.sce-fin,.sce-listnum,.sce-act,.sce-photo,.sce-bar,.sce-photo-img,.sce-cursor-ring{animation:none !important;}
  .sce-char{opacity:1 !important;filter:none !important;transform:none !important;}
}
`;
