import type { VideoPlayerType } from "./types";

function decodedSource(src: string): string {
  try {
    return decodeURIComponent(src);
  } catch {
    return src;
  }
}

export function isHlsSource(src: string, type: VideoPlayerType): boolean {
  if (type !== "auto") return type === "hls";
  // Signed URLs may put the manifest path in a query parameter instead of the
  // pathname. Explicit type="hls" handles extensionless proxy endpoints.
  return /\.m3u8(?:$|[?#&])/i.test(decodedSource(src));
}

export function unsupportedSource(src: string, type: VideoPlayerType): boolean {
  return (
    type === "auto" && /\.(?:flv|mpd)(?:$|[?#&])/i.test(decodedSource(src))
  );
}
