import type {
  HlsFragment,
  HlsMasterManifest,
  HlsMediaManifest,
  HlsVariant,
} from "./types";

export const HLS_MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
export const HLS_MAX_FRAGMENTS = 50_000;
const MAX_VARIANTS = 1024;
const MAX_DURATION = 7 * 86400;
const MAX_SEQUENCE = (1n << 64n) - 1n;
const unsupportedTags = [
  "#EXT-X-PART",
  "#EXT-X-PRELOAD-HINT",
  "#EXT-X-SERVER-CONTROL",
  "#EXT-X-SKIP",
  "#EXT-X-BYTERANGE",
  "#EXT-X-GAP",
  "#EXT-X-I-FRAMES-ONLY",
  "#EXT-X-DEFINE",
  "#EXT-X-DATERANGE",
  "#EXT-X-START",
];

/** Read the entire list so duplicate/malformed attributes cannot change player semantics. */
function attributes(line: string, subject = "HLS") {
  const body = line.slice(line.indexOf(":") + 1);
  const matcher = /([A-Z0-9-]+)=("[^"]*"|[^,"\s]+)(?:,|$)/gy;
  const result = new Map<string, string>();
  let position = 0;
  while (position < body.length) {
    matcher.lastIndex = position;
    const match = matcher.exec(body);
    if (!match || result.has(match[1]!))
      throw new Error(`${subject}包含无效或重复的属性。`);
    result.set(match[1]!, match[2]!);
    position = matcher.lastIndex;
  }
  if (!result.size || body.endsWith(","))
    throw new Error(`${subject}包含无效的属性。`);
  return result;
}

/** Shared validation for playlist, segment and loader redirect addresses. */
export function resolveHlsUri(uri: string, base: string) {
  let result: URL;
  try {
    result = new URL(uri, base);
  } catch {
    throw new Error("HLS 包含无效的资源地址。");
  }
  if (
    !["http:", "https:"].includes(result.protocol) ||
    !result.hostname ||
    result.username ||
    result.password
  )
    throw new Error("HLS 资源必须使用不含账号密码的 HTTP(S) 地址。");
  return result.href;
}

function checkResourceAttribute(attrs: Map<string, string>, base: string) {
  const value = attrs.get("URI");
  if (!value || !/^".+"$/.test(value) || !value.slice(1, -1).trim())
    throw new Error("HLS 密钥或初始化片段缺少有效地址。");
  resolveHlsUri(value.slice(1, -1), base);
}

function manifestLines(text: string, url: string) {
  if (
    text.length > HLS_MAX_MANIFEST_BYTES ||
    new TextEncoder().encode(text).byteLength > HLS_MAX_MANIFEST_BYTES
  )
    throw new Error("HLS 播放列表超过 4 MiB，无法打开可视化编辑。");
  resolveHlsUri(url, url);
  const lines = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  if (lines[0]?.trim() !== "#EXTM3U")
    throw new Error("不是有效的 M3U8 播放列表。");
  return lines;
}

function variantAttributes(line: string) {
  return attributes(line, "HLS 清晰度版本");
}

/** A master contains variants, not media segments. Resolve each URI at its own level. */
export function parseHlsMasterManifest(
  text: string,
  url: string,
): HlsMasterManifest | undefined {
  const lines = manifestLines(text, url)
    .slice(1)
    .map((line) => line.trim());
  if (
    !lines.some((line) =>
      /^#EXT-X-(?:STREAM-INF|I-FRAME-STREAM-INF|MEDIA)(?::|$)/.test(line),
    )
  )
    return;

  const variants: HlsVariant[] = [];
  let pending: Map<string, string> | undefined;
  for (const line of lines) {
    if (!line) continue;
    if (/^#EXT-X-(?:MEDIA|I-FRAME-STREAM-INF|SESSION-KEY)(?::|$)/.test(line))
      throw new Error("暂不支持带独立音轨、字幕或会话密钥的 HLS 主播放列表。");
    if (
      unsupportedTags.some((tag) => line.startsWith(tag)) ||
      /^#EXT(?:INF:|-X-(?:TARGETDURATION|MEDIA-SEQUENCE|DISCONTINUITY-SEQUENCE|ENDLIST|PLAYLIST-TYPE|KEY|MAP|DISCONTINUITY)(?::|$))/.test(
        line,
      )
    )
      throw new Error("HLS 主播放列表混入媒体片段或不支持的时间轴标记。");
    if (line.startsWith("#EXT-X-STREAM-INF")) {
      if (pending) throw new Error("HLS 清晰度版本缺少播放列表地址。");
      if (!line.startsWith("#EXT-X-STREAM-INF:"))
        throw new Error("HLS 清晰度版本缺少有效的 STREAM-INF 属性。");
      pending = variantAttributes(line);
      const bandwidth = pending.get("BANDWIDTH");
      if (
        !bandwidth ||
        !/^\d+$/.test(bandwidth) ||
        !Number.isSafeInteger(Number(bandwidth)) ||
        Number(bandwidth) <= 0
      )
        throw new Error("HLS 清晰度版本缺少有效的带宽。");
      if (
        ["AUDIO", "VIDEO", "SUBTITLES"].some((name) => pending!.has(name)) ||
        (pending.has("CLOSED-CAPTIONS") &&
          pending.get("CLOSED-CAPTIONS") !== "NONE")
      )
        throw new Error(
          "暂不支持依赖独立音轨、字幕或视频组的 HLS 清晰度版本。",
        );
      const resolution = pending.get("RESOLUTION");
      if (resolution && !/^[1-9]\d*x[1-9]\d*$/.test(resolution))
        throw new Error("HLS 清晰度版本包含无效的分辨率。");
      continue;
    }
    if (line.startsWith("#")) continue;
    if (!pending) throw new Error("HLS 清晰度地址缺少 STREAM-INF。");
    if (variants.length >= MAX_VARIANTS)
      throw new Error("HLS 清晰度版本数量超过 1,024 个。");
    const resolution = pending.get("RESOLUTION");
    const bandwidth = Number(pending.get("BANDWIDTH"));
    const name = pending.get("NAME");
    variants.push({
      index: variants.length,
      label:
        name && /^".+"$/.test(name)
          ? name.slice(1, -1)
          : `${resolution ? `${resolution} · ` : ""}${Math.round(bandwidth / 1000)} kbps`,
      url: resolveHlsUri(line, url),
    });
    pending = undefined;
  }
  if (pending) throw new Error("HLS 清晰度版本缺少播放列表地址。");
  if (!variants.length)
    throw new Error("HLS 主播放列表没有可播放的清晰度版本。");
  return { url, variants };
}

/**
 * Read only media VOD semantics supported by the segment-processing gateway.
 * This parser never fetches resources or rewrites encryption / media bytes.
 */
export function parseHlsManifest(text: string, url: string): HlsMediaManifest {
  const lines = manifestLines(text, url);

  const fragments: HlsFragment[] = [];
  const boundaries = [0];
  let sequence = 0n;
  let sequenceSeen = false;
  let elapsed = 0;
  let duration: number | undefined;
  let ended = false;
  let keyText: string | undefined;
  let keyAttributes: Map<string, string> | undefined;
  let mapText: string | undefined;
  let mapKeyText: string | undefined;
  let discontinuity = false;
  let segmentLines: string[] = [];
  for (const original of lines.slice(1)) {
    const line = original.trim();
    if (!line) continue;
    if (ended) throw new Error("HLS 结束标记后仍有内容，无法安全编辑。");
    if (unsupportedTags.some((tag) => line.startsWith(tag)))
      throw new Error("暂不支持直播、LL-HLS、字节范围或特殊时间轴播放列表。");
    if (
      line.startsWith("#EXT-X-STREAM-INF:") ||
      line.startsWith("#EXT-X-MEDIA:")
    )
      throw new Error("这是主播放列表，请先选择一个媒体清晰度版本。");
    if (line === "#EXT-X-ENDLIST") {
      ended = true;
      continue;
    }
    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE:")) {
      const raw = line.slice("#EXT-X-MEDIA-SEQUENCE:".length);
      if (sequenceSeen || duration !== undefined || fragments.length)
        throw new Error("HLS 媒体序号必须在片段前且只能声明一次。");
      if (!/^\d+$/.test(raw) || BigInt(raw) > MAX_SEQUENCE)
        throw new Error("无效的 HLS 媒体序号。");
      sequence = BigInt(raw);
      sequenceSeen = true;
      continue;
    }
    if (line.startsWith("#EXT-X-SESSION-KEY"))
      throw new Error(
        "暂不支持会话密钥 EXT-X-SESSION-KEY，请使用媒体列表内声明的 identity AES-128 密钥。",
      );
    if (line.startsWith("#EXT-X-KEY:")) {
      const attrs = attributes(line, "HLS 密钥");
      const method = attrs.get("METHOD");
      if (method !== "AES-128" && !(method === "NONE" && attrs.size === 1))
        throw new Error("暂只支持未加密或 identity AES-128 的 HLS。");
      const iv = attrs.get("IV");
      if (iv !== undefined && !/^0[xX][\da-fA-F]{1,32}$/.test(iv))
        throw new Error("AES-128 的 IV 必须是最多 128 位的十六进制数。");
      const format = attrs.get("KEYFORMAT");
      if (format !== undefined && format !== '"identity"')
        throw new Error("暂不支持 DRM HLS 可视化编辑。");
      const versions = attrs.get("KEYFORMATVERSIONS");
      if (versions !== undefined && versions !== '"1"')
        throw new Error("暂只支持 identity AES-128 密钥格式版本 1。");
      if (method === "AES-128") checkResourceAttribute(attrs, url);
      keyText = original;
      keyAttributes = attrs;
      continue;
    }
    if (line.startsWith("#EXT-X-MAP:")) {
      const attrs = attributes(line, "HLS 初始化片段");
      if (attrs.has("BYTERANGE"))
        throw new Error("暂不支持字节范围初始化片段。");
      if (
        keyText &&
        keyText.trim() !== "#EXT-X-KEY:METHOD=NONE" &&
        !keyAttributes?.has("IV")
      )
        throw new Error("加密初始化片段必须指定 IV。");
      checkResourceAttribute(attrs, url);
      mapText = original;
      mapKeyText = keyText;
      continue;
    }
    if (line === "#EXT-X-DISCONTINUITY") {
      discontinuity = true;
      continue;
    }
    if (line.startsWith("#EXTINF:")) {
      if (duration !== undefined) throw new Error("HLS 片段缺少地址。");
      const raw = line.slice(8).split(",", 1)[0]!;
      const parsed = Number(raw);
      if (
        !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw) ||
        !Number.isFinite(parsed) ||
        parsed <= 0 ||
        parsed > MAX_DURATION ||
        elapsed + parsed > MAX_DURATION
      )
        throw new Error("无效的 HLS 片段时长。");
      duration = parsed;
      segmentLines.push(original);
      continue;
    }
    if (line.startsWith("#")) {
      // Keep per-fragment comments (e.g. PROGRAM-DATE-TIME) in the shown text.
      if (
        duration !== undefined ||
        line.startsWith("#EXT-X-PROGRAM-DATE-TIME:")
      )
        segmentLines.push(original);
      continue;
    }
    if (duration === undefined) throw new Error("HLS 片段地址缺少 EXTINF。");
    if (fragments.length >= HLS_MAX_FRAGMENTS)
      throw new Error("HLS 片段数量超过 50,000 个。");
    if (sequence > MAX_SEQUENCE) throw new Error("HLS 媒体序号超出范围。");
    if (fragments.length && !!fragments[0]!.mapText !== !!mapText)
      throw new Error("暂不支持在同一播放列表内切换 TS 与 fMP4。");
    const context: string[] = [];
    // An encrypted MAP retains its own key even when later segments rotate it.
    if (mapText) {
      if (mapKeyText) context.push(mapKeyText);
      context.push(mapText);
    }
    if (keyText && (!mapText || keyText !== mapKeyText)) context.push(keyText);
    if (discontinuity) context.push("#EXT-X-DISCONTINUITY");
    fragments.push({
      index: fragments.length,
      sequence: sequence.toString(),
      startSeconds: elapsed,
      endSeconds: elapsed + duration,
      duration,
      uri: line,
      resolvedUrl: resolveHlsUri(line, url),
      rawText: [...context, ...segmentLines, original].join("\n"),
      keyText,
      mapText,
      mapKeyText,
      discontinuity,
    });
    elapsed += duration;
    sequence++;
    boundaries.push(elapsed);
    duration = undefined;
    discontinuity = false;
    segmentLines = [];
  }
  if (!ended) throw new Error("仅支持带 ENDLIST 的点播 M3U8，暂不支持直播。");
  if (duration !== undefined || !fragments.length)
    throw new Error("HLS 没有完整的视频片段。");
  return { url, fragments, duration: elapsed, boundaries };
}

/** Exact edges belong to the next fragment; the final edge belongs to the last. */
export function findHlsFragment(
  manifest: HlsMediaManifest,
  seconds: number,
): HlsFragment | undefined {
  if (!Number.isFinite(seconds) || !manifest.fragments.length) return;
  const time = Math.max(0, Math.min(manifest.duration, seconds));
  let low = 0;
  let high = manifest.fragments.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (manifest.fragments[middle]!.endSeconds <= time) low = middle + 1;
    else high = middle;
  }
  return manifest.fragments[low];
}

export function snapHlsBoundary(
  manifest: HlsMediaManifest,
  seconds: number,
): number {
  if (!Number.isFinite(seconds)) return 0;
  const edges = manifest.boundaries;
  let low = 0;
  let high = edges.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (edges[middle]! < seconds) low = middle + 1;
    else high = middle;
  }
  const right = edges[low]!;
  const left = edges[Math.max(0, low - 1)]!;
  return Math.abs(seconds - left) <= Math.abs(right - seconds) ? left : right;
}
