/** A master/media playlist and its authorized, unprocessed playback address. */
export interface HlsManifestSource {
  text: string;
  url: string;
  playbackUrl?: string;
}

/** Load a playlist only; the framework never downloads segments or keys. */
export type HlsManifestLoader = (
  url: string,
  options: { signal: AbortSignal },
) => Promise<HlsManifestSource>;

export interface HlsVariant {
  index: number;
  label: string;
  url: string;
}

export interface HlsMasterManifest {
  url: string;
  variants: HlsVariant[];
}

export interface HlsResolvedManifest {
  /** The final media playlist; never reuse an upstream master's playback URL. */
  source: HlsManifestSource;
  manifest: HlsMediaManifest;
  /** Choices from the first master, so switching reloads the same entry point. */
  variants: HlsVariant[];
  selectedVariant: number;
}

export interface HlsManifestResolveOptions {
  loadManifest?: HlsManifestLoader;
  signal?: AbortSignal;
  variantIndex?: number;
}

export interface HlsRange {
  startSeconds: number;
  endSeconds: number;
  label?: string;
}

export interface HlsMarker {
  atSeconds: number;
  label?: string;
}

export interface HlsFragment {
  index: number;
  /** Decimal string avoids losing precision for a uint64 MEDIA-SEQUENCE. */
  sequence: string;
  startSeconds: number;
  endSeconds: number;
  duration: number;
  uri: string;
  resolvedUrl: string;
  /** Original segment lines plus the effective KEY/MAP context. Never HTML. */
  rawText: string;
  keyText?: string;
  mapText?: string;
  mapKeyText?: string;
  discontinuity: boolean;
}

export interface HlsMediaManifest {
  url: string;
  duration: number;
  fragments: HlsFragment[];
  /** Ordered segment edges, including zero and the final duration. */
  boundaries: number[];
}

export interface HlsWorkbenchApi {
  seek: (seconds: number) => void;
  getSelection: () => HlsRange | undefined;
  getCurrentFragment: () => HlsFragment | undefined;
}
