import Image from "next/image";

interface IconButtonProps {
  src: string;
  label: string;
  onClick: () => void;
  size?: number;
}

const MIN_TAP_TARGET = 44;

export default function IconButton({
  src,
  label,
  onClick,
  size = 32,
}: IconButtonProps) {
  const tapSize = Math.max(size, MIN_TAP_TARGET);

  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: `${tapSize}px`,
        height: `${tapSize}px`,
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
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    </button>
  );
}
