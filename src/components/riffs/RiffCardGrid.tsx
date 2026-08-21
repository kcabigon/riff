"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";

interface RiffCardGridProps<T> {
  items: T[];
  keyForItem: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  // Centers a single item instead of leaving it flush left.
  centerSingle?: boolean;
}

export default function RiffCardGrid<T>({
  items,
  keyForItem,
  renderItem,
  centerSingle = false,
}: RiffCardGridProps<T>) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        flexWrap: isMobile ? "nowrap" : "wrap",
        gap: "20px",
        justifyContent:
          centerSingle && items.length === 1 ? "center" : "flex-start",
      }}
    >
      {items.map((item) => (
        <div
          key={keyForItem(item)}
          style={{ width: isMobile ? "100%" : "466px", flexShrink: 0 }}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
