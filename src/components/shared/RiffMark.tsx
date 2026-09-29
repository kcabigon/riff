// A tiny, hand-drawn stand-in for the Riff logo — the same four brush strokes
// (cyan, pink, yellow, yellow + cyan) with the black drop shadow, as plain
// rectangles. The real logo SVG is ~500KB of brush texture that's invisible at
// this size, and its paths are too heavy to animate.
//
// Each row is its own group (class "riff-mark-row") so a parent can animate
// the strokes one after another on hover — see the .riff-row-link rules in
// ClubPageLayout.
const ROWS: {
  y: number;
  strokes: { x: number; width: number; fill: string }[];
}[] = [
  { y: 0.25, strokes: [{ x: 1.5, width: 24.25, fill: "#01EFFC" }] },
  { y: 7.25, strokes: [{ x: 1.5, width: 28.5, fill: "#C01582" }] },
  { y: 14.25, strokes: [{ x: 1.5, width: 21.25, fill: "#EECF01" }] },
  {
    y: 21.25,
    strokes: [
      { x: 1.25, width: 10.65, fill: "#EECF01" },
      { x: 15.25, width: 11.75, fill: "#01EFFC" },
    ],
  },
];

const STROKE_HEIGHT = 5.25;
// The logo's shadow falls down and to the left.
const SHADOW_OFFSET = 1;

// "progress" is the in-progress riff's version — gray strokes on the same
// black shadow, the colors still to come once it's revealed.
export default function RiffMark({
  width = 20,
  variant = "color",
}: {
  width?: number;
  variant?: "color" | "progress";
}) {
  return (
    <svg
      width={width}
      height={(width * 28) / 30}
      viewBox="0 0 30 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {ROWS.map((row) => (
        <g key={row.y} className="riff-mark-row">
          {row.strokes.map((stroke) => (
            <g key={stroke.x}>
              <rect
                x={stroke.x - SHADOW_OFFSET}
                y={row.y + SHADOW_OFFSET}
                width={stroke.width}
                height={STROKE_HEIGHT}
                fill="#000000"
              />
              <rect
                x={stroke.x}
                y={row.y}
                width={stroke.width}
                height={STROKE_HEIGHT}
                fill={variant === "progress" ? "#CCCCCC" : stroke.fill}
              />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
