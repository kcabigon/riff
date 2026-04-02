import Image from "next/image";

interface IconButtonProps {
  src: string;
  label: string;
  onClick: () => void;
  size?: number;
  width?: number;
  height?: number;
}

const MIN_TAP_TARGET = 44;

export default function IconButton({
  src,
  label,
  onClick,
  size = 32,
  width,
  height,
}: IconButtonProps) {
  const w = width ?? size;
  const h = height ?? size;
  const tapW = Math.max(w, MIN_TAP_TARGET);
  const tapH = Math.max(h, MIN_TAP_TARGET);

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: `${tapW}px`,
        height: `${tapH}px`,
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src={src}
        alt={label}
        width={w}
        height={h}
        style={{ display: "block", objectFit: "contain" }}
      />
    </button>
  );
}
