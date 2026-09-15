import Tagline from "@/components/Tagline";

// Tagline-heading treatment used for section labels like "CURRENT RIFF" /
// "PAST RIFFS" on My Riffs and the club page.
export default function SectionHeading({
  text,
  color,
  width,
}: {
  text: string;
  color: string;
  width: number;
}) {
  return (
    <Tagline
      text={text}
      color={color}
      width={width}
      fontSize={16}
      fontFamily="var(--font-dm-sans)"
      fontWeight={700}
      align="left"
      heightPadding={9}
    />
  );
}
