import Image from "next/image";

interface CloseButtonProps {
  onClick: () => void;
  size?: number;
}

export default function CloseButton({ onClick, size = 32 }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      style={{
        width: `${size}px`,
        height: `${size}px`,
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
        src="/icons/close.svg"
        alt="Close"
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    </button>
  );
}
