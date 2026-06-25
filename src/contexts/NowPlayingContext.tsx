"use client";

import { createContext, useContext, useState } from "react";
import type { JamEmbedType } from "@/lib/jam-embed";

export type NowPlaying = {
  embedUrl: string;
  embedType: JamEmbedType;
  title: string;
  thumbnailUrl: string | null;
};

type NowPlayingContextType = {
  nowPlaying: NowPlaying | null;
  play: (track: NowPlaying) => void;
  stop: () => void;
};

const NowPlayingContext = createContext<NowPlayingContextType>({
  nowPlaying: null,
  play: () => {},
  stop: () => {},
});

export function NowPlayingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  return (
    <NowPlayingContext.Provider
      value={{
        nowPlaying,
        play: setNowPlaying,
        stop: () => setNowPlaying(null),
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  return useContext(NowPlayingContext);
}
