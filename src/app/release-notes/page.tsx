import WhatsNewPage from "@/components/whats-new/WhatsNewPage";

export const metadata = {
  title: "What's New",
  description:
    "The latest features we've shipped to Riff, and a peek at what we're building next.",
  // Hidden for now — not linked anywhere and kept out of search until we're ready.
  robots: { index: false, follow: false },
};

export default function ReleaseNotes() {
  return <WhatsNewPage />;
}
