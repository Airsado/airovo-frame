import { afterEach, describe, expect, it, vi } from "vitest";
import { HLS_MAX_MANIFEST_BYTES, parseHlsMasterManifest } from "./manifest";
import { resolveHlsManifest } from "./resolution";
import type { HlsManifestLoader, HlsManifestSource } from "./types";

const entryUrl = "https://v.lzcdn27.com/20261015/19214_fdcf15a2/index.m3u8";
const masterText =
  "#EXTM3U\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=800000,RESOLUTION=1080x608\n2000k/hls/index.m3u8";
const mediaText =
  "#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXTINF:5,\nfirst.ts\n#EXTINF:3,\n../last.ts\n#EXT-X-ENDLIST\n";
const master = (url: string, child = "media.m3u8"): HlsManifestSource => ({
  url,
  text: `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\n${child}`,
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("HLS master playlist parsing", () => {
  it("resolves the reported Liangzi relative variant and reads its display attributes", () => {
    expect(parseHlsMasterManifest(masterText, entryUrl)).toEqual({
      url: entryUrl,
      variants: [
        {
          index: 0,
          label: "1080x608 · 800 kbps",
          url: "https://v.lzcdn27.com/20261015/19214_fdcf15a2/2000k/hls/index.m3u8",
        },
      ],
    });
  });

  it("keeps quoted commas in codec/name attributes and supports absolute/root/relative URIs", () => {
    const text = `\uFEFF#EXTM3U\r
#EXT-X-STREAM-INF:BANDWIDTH=800000,CODECS="avc1.4d401f,mp4a.40.2",NAME="高清,测试"\r
../hd.m3u8?token=1\r
#EXT-X-STREAM-INF:BANDWIDTH=400000\r
/low.m3u8\r
#EXT-X-STREAM-INF:BANDWIDTH=1600000\r
https://cdn.example/uhd.m3u8`;
    expect(parseHlsMasterManifest(text, entryUrl)?.variants).toEqual([
      {
        index: 0,
        label: "高清,测试",
        url: "https://v.lzcdn27.com/20261015/hd.m3u8?token=1",
      },
      { index: 1, label: "400 kbps", url: "https://v.lzcdn27.com/low.m3u8" },
      { index: 2, label: "1600 kbps", url: "https://cdn.example/uhd.m3u8" },
    ]);
  });

  it("leaves actual media playlists to the existing strict VOD parser", () => {
    expect(parseHlsMasterManifest(mediaText, entryUrl)).toBeUndefined();
  });

  it("bounds rendition choices independently from the media fragment count", () => {
    const variant = "#EXT-X-STREAM-INF:BANDWIDTH=1\nmedia.m3u8\n";
    expect(
      parseHlsMasterManifest(`#EXTM3U\n${variant.repeat(1024)}`, entryUrl)
        ?.variants,
    ).toHaveLength(1024);
    expect(() =>
      parseHlsMasterManifest(`#EXTM3U\n${variant.repeat(1025)}`, entryUrl),
    ).toThrow("1,024");
  });

  it.each([
    "#EXT-X-STREAM-INF:BANDWIDTH=800000",
    "orphan.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=800000\n#EXT-X-STREAM-INF:BANDWIDTH=1\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=0\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=1,BANDWIDTH=2\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=1,broken\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=1,\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=0x720\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=1\njavascript:alert(1)",
    "#EXT-X-STREAM-INF:BANDWIDTH=1\nhttps://user:secret@cdn.example/media.m3u8",
    "#EXTINF:5,\none.ts\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nmedia.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=1\nmedia.m3u8\n#EXT-X-ENDLIST",
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",URI="audio.m3u8"',
    '#EXT-X-STREAM-INF:BANDWIDTH=1,AUDIO="audio"\nmedia.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=1,SUBTITLES="sub"\nmedia.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=1\nmedia.m3u8\n#EXT-X-SESSION-KEY:METHOD=AES-128,URI="key.bin"',
    '#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=1,URI="iframes.m3u8"',
  ])("rejects malformed, mixed or unsupported master semantics: %s", (body) => {
    expect(() =>
      parseHlsMasterManifest(`#EXTM3U\n${body}`, entryUrl),
    ).toThrow();
  });
});

describe("HLS playlist resolution", () => {
  it("follows the reported master, resolves fragment paths against the leaf, and never fetches segments", async () => {
    const load = vi.fn<HlsManifestLoader>().mockImplementation(async (url) => ({
      text: mediaText,
      url,
      playbackUrl: "/signed/leaf.m3u8?token=leaf",
    }));
    const result = await resolveHlsManifest(
      {
        text: masterText,
        url: entryUrl,
        playbackUrl: "/signed/master.m3u8?token=master",
      },
      { loadManifest: load },
    );
    const leafUrl =
      "https://v.lzcdn27.com/20261015/19214_fdcf15a2/2000k/hls/index.m3u8";
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(leafUrl, {
      signal: expect.any(AbortSignal),
    });
    expect(result.source).toEqual({
      text: mediaText,
      url: leafUrl,
      playbackUrl: "/signed/leaf.m3u8?token=leaf",
    });
    expect(result.manifest.duration).toBe(8);
    expect(result.manifest.fragments[0]?.resolvedUrl).toBe(
      "https://v.lzcdn27.com/20261015/19214_fdcf15a2/2000k/hls/first.ts",
    );
    expect(result.manifest.fragments[1]?.resolvedUrl).toBe(
      "https://v.lzcdn27.com/20261015/19214_fdcf15a2/2000k/last.ts",
    );
    expect(result.selectedVariant).toBe(0);
  });

  it("selects a top-level version, follows nested masters and preserves only the leaf playback URL", async () => {
    const source = {
      text: `${masterText}\n#EXT-X-STREAM-INF:BANDWIDTH=1600000\n../high.m3u8`,
      url: entryUrl,
      playbackUrl: "/signed/master.m3u8",
    };
    const load = vi
      .fn<HlsManifestLoader>()
      .mockResolvedValueOnce(
        master("https://redirect.example/levels/high.m3u8", "leaf/index.m3u8"),
      )
      .mockResolvedValueOnce({
        text: mediaText,
        url: "https://final.example/movie/leaf.m3u8",
      });
    const result = await resolveHlsManifest(source, {
      variantIndex: 1,
      loadManifest: load,
    });
    expect(load.mock.calls.map((args) => args[0])).toEqual([
      "https://v.lzcdn27.com/20261015/high.m3u8",
      "https://redirect.example/levels/leaf/index.m3u8",
    ]);
    expect(result.source).toEqual({
      text: mediaText,
      url: "https://final.example/movie/leaf.m3u8",
    });
    expect(result.manifest.fragments[0]?.resolvedUrl).toBe(
      "https://final.example/movie/first.ts",
    );
    expect(result.variants).toHaveLength(2);
    expect(result.selectedVariant).toBe(1);
  });

  it("supports direct media without invoking a loader and still rejects unsupported VOD semantics", async () => {
    const load = vi.fn<HlsManifestLoader>();
    const result = await resolveHlsManifest(
      {
        text: mediaText,
        url: entryUrl,
        playbackUrl: "/api/authorized/manifest.m3u8",
      },
      { loadManifest: load },
    );
    expect(result.variants).toEqual([]);
    expect(result.selectedVariant).toBe(0);
    expect(result.source.playbackUrl).toBe("/api/authorized/manifest.m3u8");
    expect(load).not.toHaveBeenCalled();
    await expect(
      resolveHlsManifest({
        text: mediaText.replace("#EXT-X-ENDLIST", ""),
        url: entryUrl,
      }),
    ).rejects.toThrow("点播");
  });

  it.each([-1, 1, 0.5, NaN])(
    "rejects nonexistent selected version %s without fetching",
    async (variantIndex) => {
      const load = vi.fn<HlsManifestLoader>();
      await expect(
        resolveHlsManifest(
          { text: masterText, url: entryUrl },
          { variantIndex, loadManifest: load },
        ),
      ).rejects.toThrow("版本不存在");
      expect(load).not.toHaveBeenCalled();
    },
  );

  it("detects direct cycles, redirect cycles and fragment-only cycle aliases", async () => {
    const load = vi
      .fn<HlsManifestLoader>()
      .mockResolvedValue(master(entryUrl, "index.m3u8"));
    await expect(
      resolveHlsManifest(master(entryUrl, "index.m3u8#loop"), {
        loadManifest: load,
      }),
    ).rejects.toThrow("循环");
    expect(load).not.toHaveBeenCalled();
    await expect(
      resolveHlsManifest(master(entryUrl), { loadManifest: load }),
    ).rejects.toThrow("重定向后存在循环");
    const loop = vi
      .fn<HlsManifestLoader>()
      .mockImplementation(async (url) => master(url, "media.m3u8"));
    await expect(
      resolveHlsManifest(master(entryUrl), { loadManifest: loop }),
    ).rejects.toThrow("循环");
    expect(loop).toHaveBeenCalledTimes(1);
  });

  it("accepts five master levels but rejects a sixth before loading its child", async () => {
    let count = 0;
    const load = vi.fn<HlsManifestLoader>().mockImplementation(async (url) => {
      count++;
      return count < 5
        ? master(url, `child${count}.m3u8`)
        : { url, text: mediaText };
    });
    await expect(
      resolveHlsManifest(master(entryUrl), { loadManifest: load }),
    ).resolves.toMatchObject({ manifest: { duration: 8 } });
    expect(load).toHaveBeenCalledTimes(5);
    const infinite = vi
      .fn<HlsManifestLoader>()
      .mockImplementation(async (url) => master(url, `child${++count}.m3u8`));
    await expect(
      resolveHlsManifest(master(entryUrl), { loadManifest: infinite }),
    ).rejects.toThrow("超过 5 层");
    expect(infinite).toHaveBeenCalledTimes(5);
  });

  it("cancels before loading and during a loader that ignores the signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const load = vi.fn<HlsManifestLoader>();
    await expect(
      resolveHlsManifest(master(entryUrl), {
        signal: controller.signal,
        loadManifest: load,
      }),
    ).rejects.toThrow("已取消");
    expect(load).not.toHaveBeenCalled();
    const active = new AbortController();
    load.mockImplementation(() => new Promise(() => undefined));
    const resolution = resolveHlsManifest(master(entryUrl), {
      signal: active.signal,
      loadManifest: load,
    });
    active.abort();
    await expect(resolution).rejects.toThrow("已取消");
    expect(load.mock.calls[0]?.[1].signal.aborted).toBe(true);
  });

  it("applies one 30-second deadline across all nested loads", async () => {
    vi.useFakeTimers();
    const load = vi
      .fn<HlsManifestLoader>()
      .mockImplementationOnce(async (url) => {
        await new Promise((resolve) => setTimeout(resolve, 20_000));
        return master(url, "nested.m3u8");
      })
      .mockImplementationOnce(() => new Promise(() => undefined));
    const resolution = resolveHlsManifest(master(entryUrl), {
      loadManifest: load,
    });
    const failure = expect(resolution).rejects.toThrow("超时");
    await vi.advanceTimersByTimeAsync(30_000);
    await failure;
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.calls[1]?.[1].signal.aborted).toBe(true);
  });

  it("checks manifest bytes for custom loader results and never hides real errors", async () => {
    const tooLarge = vi
      .fn<HlsManifestLoader>()
      .mockImplementation(async (url) => ({
        url,
        text: "中".repeat(Math.ceil(HLS_MAX_MANIFEST_BYTES / 3)),
      }));
    await expect(
      resolveHlsManifest(master(entryUrl), { loadManifest: tooLarge }),
    ).rejects.toThrow("4 MiB");
    const denied = vi
      .fn<HlsManifestLoader>()
      .mockRejectedValue(new Error("上游拒绝读取播放列表"));
    await expect(
      resolveHlsManifest(master(entryUrl), { loadManifest: denied }),
    ).rejects.toThrow("上游拒绝");
  });

  it("uses credential-free CORS fetch and final response URL for default browser loading", async () => {
    const response = new Response(mediaText, { status: 200 });
    Object.defineProperty(response, "url", {
      value: "https://redirect.example/actual/leaf.m3u8",
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    const result = await resolveHlsManifest(master(entryUrl));
    expect(fetchMock).toHaveBeenCalledWith(
      "https://v.lzcdn27.com/20261015/19214_fdcf15a2/media.m3u8",
      {
        signal: expect.any(AbortSignal),
        mode: "cors",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      },
    );
    expect(result.source.url).toBe("https://redirect.example/actual/leaf.m3u8");
    expect(result.manifest.fragments[0]?.resolvedUrl).toBe(
      "https://redirect.example/actual/first.ts",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds streamed payloads even when content-length is missing", async () => {
    const cancel = vi.fn();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(HLS_MAX_MANIFEST_BYTES));
          controller.enqueue(new Uint8Array(1));
        },
        cancel,
      }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(resolveHlsManifest(master(entryUrl))).rejects.toThrow("4 MiB");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("reports HTTP and CORS/network failures without exposing requested signed URLs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("gateway error", { status: 522 }))
      .mockRejectedValueOnce(
        new Error("network error https://signed.example/?secret=private"),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveHlsManifest(master(entryUrl))).rejects.toThrow(
      "HTTP 522",
    );
    await expect(resolveHlsManifest(master(entryUrl))).rejects.toThrow(
      "跨域设置",
    );
  });
});
