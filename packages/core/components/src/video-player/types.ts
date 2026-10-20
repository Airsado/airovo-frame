import type Artplayer from "artplayer";
import type { Option } from "artplayer";

export type VideoPlayerType = "auto" | "hls" | "native";

/** External text captions; ASS is converted to text cues, without ASS styling. */
export interface VideoPlayerSubtitle {
  url: string;
  type?: "vtt" | "srt" | "ass";
  name?: string;
  encoding?: string;
}

/** Source and decoder lifecycle belong to VideoPlayer, not an option spread. */
export type VideoPlayerOptions = Partial<
  Omit<Option, "container" | "url" | "type" | "customType">
>;

export interface VideoPlayerMetadata {
  duration: number;
  width: number;
  height: number;
}

export interface VideoPlayerProgress {
  currentTime: number;
  duration: number;
}

export interface VideoPlayerError {
  code: "load" | "unsupported" | "network" | "media" | "playback" | "subtitle";
  message: string;
  /** Original diagnostic data is emitted, never interpolated into the player UI. */
  cause?: unknown;
}

export interface VideoPlayerApi {
  getInstance: () => Artplayer | undefined;
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  screenshot: (name?: string) => Promise<string | undefined>;
  retry: () => void;
}
