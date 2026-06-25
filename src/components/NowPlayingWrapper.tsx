"use client";

import {
  NowPlayingProvider,
  useNowPlaying,
} from "@/contexts/NowPlayingContext";
import NowPlayingBar from "@/components/NowPlayingBar";

const BAR_HEIGHT = 152;

function NowPlayingLayout({ children }: { children: React.ReactNode }) {
  const { nowPlaying } = useNowPlaying();
  return (
    <>
      <div style={{ paddingBottom: nowPlaying ? BAR_HEIGHT : 0 }}>
        {children}
      </div>
      <NowPlayingBar />
    </>
  );
}

export default function NowPlayingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NowPlayingProvider>
      <NowPlayingLayout>{children}</NowPlayingLayout>
    </NowPlayingProvider>
  );
}
