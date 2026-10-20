import type { VideoPlayerSubtitle } from "./types";

/** Query strings and signed URLs must not hide a caption file's real extension. */
export function subtitleType(url: string): VideoPlayerSubtitle["type"] {
  const extension = url.split(/[?#]/, 1)[0]?.match(/\.(vtt|srt|ass)$/i)?.[1];
  return extension?.toLowerCase() as VideoPlayerSubtitle["type"];
}

export function subtitleOptions(subtitle?: VideoPlayerSubtitle) {
  if (!subtitle?.url.trim()) return undefined;
  return {
    ...subtitle,
    url: subtitle.url.trim(),
    type: subtitle.type ?? subtitleType(subtitle.url),
    encoding: subtitle.encoding ?? "utf-8",
    // Caption content is remote text; do not interpret it as trusted HTML.
    escape: true,
  };
}
