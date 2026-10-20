import {
  HLS_MAX_MANIFEST_BYTES,
  parseHlsManifest,
  parseHlsMasterManifest,
  resolveHlsUri,
} from "./manifest";
import type {
  HlsManifestLoader,
  HlsManifestResolveOptions,
  HlsManifestSource,
  HlsResolvedManifest,
  HlsVariant,
} from "./types";

const MAX_MASTER_DEPTH = 5;
const LOAD_TIMEOUT_MS = 30_000;
const sizeError = () =>
  new Error("HLS 播放列表超过 4 MiB，无法打开可视化编辑。");

/** Public browser fetch respects CORS and sends no application credentials. */
const browserLoader: HlsManifestLoader = async (url, { signal }) => {
  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  } catch {
    if (signal.aborted) throw new Error("HLS 播放列表加载已取消。");
    throw new Error("无法加载 HLS 子播放列表，请检查地址、网络或跨域设置。");
  }
  if (!response.ok)
    throw new Error(`HLS 子播放列表请求失败（HTTP ${response.status}）。`);
  if (Number(response.headers.get("content-length")) > HLS_MAX_MANIFEST_BYTES) {
    void response.body?.cancel().catch(() => undefined);
    throw sizeError();
  }
  const resolvedUrl = resolveHlsUri(response.url || url, url);
  let text = "";
  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > HLS_MAX_MANIFEST_BYTES) {
          void reader.cancel().catch(() => undefined);
          throw sizeError();
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  } else {
    text = await response.text();
    if (new TextEncoder().encode(text).byteLength > HLS_MAX_MANIFEST_BYTES)
      throw sizeError();
  }
  return { text, url: resolvedUrl };
};

function checkedSource(source: HlsManifestSource): HlsManifestSource {
  if (
    !source ||
    typeof source.text !== "string" ||
    typeof source.url !== "string"
  )
    throw new Error("HLS 加载器没有返回有效的播放列表内容和地址。");
  const url = resolveHlsUri(source.url, source.url);
  // A relative playback address can target the app's authorized same-origin gateway.
  // Validate the scheme without rebasing it onto the upstream manifest's origin.
  if (source.playbackUrl) resolveHlsUri(source.playbackUrl, url);
  return { ...source, url };
}

function visitKey(url: string) {
  const parsed = new URL(url);
  // Fragments never change the requested resource and cannot evade cycle checks.
  parsed.hash = "";
  return parsed.href;
}

/** Follow only manifests, select a concrete media version and retain its timeline. */
export async function resolveHlsManifest(
  source: HlsManifestSource,
  options: HlsManifestResolveOptions = {},
): Promise<HlsResolvedManifest> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(() => {
    timedOut = true;
    abort();
  }, LOAD_TIMEOUT_MS);
  const abortError = () =>
    new Error(
      timedOut ? "HLS 播放列表加载超时，请重试。" : "HLS 播放列表加载已取消。",
    );
  const assertActive = () => {
    if (controller.signal.aborted) throw abortError();
  };
  const load = options.loadManifest ?? browserLoader;
  const loadCancellable = async (url: string) => {
    assertActive();
    let cancel: (() => void) | undefined;
    const cancellation = new Promise<never>((_, reject) => {
      cancel = () => reject(abortError());
      controller.signal.addEventListener("abort", cancel, { once: true });
    });
    try {
      const loaded = await Promise.race([
        load(url, { signal: controller.signal }),
        cancellation,
      ]);
      assertActive();
      return checkedSource(loaded);
    } finally {
      if (cancel) controller.signal.removeEventListener("abort", cancel);
    }
  };

  try {
    assertActive();
    let current = checkedSource(source);
    const visited = new Set([visitKey(current.url)]);
    let variants: HlsVariant[] = [];
    let selectedVariant = 0;
    let depth = 0;
    for (;;) {
      assertActive();
      const master = parseHlsMasterManifest(current.text, current.url);
      if (!master) {
        return {
          source: current,
          manifest: parseHlsManifest(current.text, current.url),
          variants,
          selectedVariant,
        };
      }
      if (++depth > MAX_MASTER_DEPTH)
        throw new Error("HLS 主播放列表嵌套超过 5 层，无法继续解析。");
      let index = 0;
      if (depth === 1) {
        variants = master.variants;
        index = options.variantIndex ?? 0;
        if (!Number.isInteger(index) || index < 0 || index >= variants.length)
          throw new Error("所选 HLS 清晰度版本不存在，请重新选择。");
        selectedVariant = index;
      }
      const nextUrl = master.variants[index]!.url;
      const requestedKey = visitKey(nextUrl);
      if (visited.has(requestedKey))
        throw new Error("HLS 主播放列表存在循环引用，无法继续解析。");
      visited.add(requestedKey);
      const loaded = await loadCancellable(nextUrl);
      const finalKey = visitKey(loaded.url);
      if (finalKey !== requestedKey && visited.has(finalKey))
        throw new Error("HLS 主播放列表重定向后存在循环引用。");
      visited.add(finalKey);
      current = loaded;
    }
  } catch (error) {
    if (controller.signal.aborted) throw abortError();
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
