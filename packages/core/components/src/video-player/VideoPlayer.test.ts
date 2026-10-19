import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, KeepAlive, nextTick, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VideoPlayer from "./VideoPlayer.vue";
import { isHlsSource } from "./source";

const runtime = vi.hoisted(() => ({
  loadArtplayer: vi.fn(),
  loadHls: vi.fn(),
}));
vi.mock("./runtime", () => runtime);

const players: FakeArt[] = [];
const decoders: FakeHls[] = [];
let nativeHls = "";
let hlsSupported = true;

class FakeArt {
  option: any;
  video = document.createElement("video");
  handlers = new Map<string, Array<(...args: any[]) => void>>();
  controls = { add: vi.fn() };
  icons = { screenshot: "<svg></svg>" };
  i18n = { get: (key: string) => key };
  notice = { show: "" };
  seek = 0;
  play = vi.fn(async () => {});
  pause = vi.fn(() => this.emit("video:pause"));
  screenshot = vi.fn(async () => "data:image/png;base64,frame");
  destroy = vi.fn((_removeHtml: boolean) => this.emit("destroy"));
  constructor(option: any) {
    this.option = option;
    this.video.load = vi.fn();
    this.video.canPlayType = vi.fn(() => nativeHls as CanPlayTypeResult);
    option.container.append(this.video);
    players.push(this);
    Promise.resolve().then(() => {
      if (option.type === "m3u8")
        void option.customType.m3u8(this.video, option.url, this);
    });
  }
  on(name: string, listener: (...args: any[]) => void) {
    this.handlers.set(name, [...(this.handlers.get(name) ?? []), listener]);
    return this;
  }
  off(name: string) {
    this.handlers.delete(name);
    return this;
  }
  emit(name: string, ...args: any[]) {
    this.handlers.get(name)?.forEach((listener) => listener(...args));
    return this;
  }
}

class FakeHls {
  static Events = { ERROR: "hlsError" };
  static isSupported() {
    return hlsSupported;
  }
  on = vi.fn((_name: string, listener: (...args: any[]) => void) => {
    this.listener = listener;
  });
  loadSource = vi.fn();
  attachMedia = vi.fn();
  destroy = vi.fn();
  listener?: (...args: any[]) => void;
  constructor() {
    decoders.push(this);
  }
  error(data: object) {
    this.listener?.("hlsError", data);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const wrappers: Array<ReturnType<typeof mount>> = [];
function render(props: Record<string, unknown> = {}) {
  const wrapper = mount(VideoPlayer, {
    props: { src: "/sample.mp4", ...props },
  });
  wrappers.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  players.length = 0;
  decoders.length = 0;
  nativeHls = "";
  hlsSupported = true;
  runtime.loadArtplayer.mockReset().mockResolvedValue(FakeArt);
  runtime.loadHls.mockReset().mockResolvedValue(FakeHls);
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe("VideoPlayer media lifecycle", () => {
  it("keeps inactive and empty players passive without importing a decoder", async () => {
    const wrapper = render({ active: false });
    await flushPromises();
    expect(runtime.loadArtplayer).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("播放器已停止");
    await wrapper.setProps({ active: true, src: "" });
    expect(wrapper.text()).toContain("请选择播放内容");
    expect(runtime.loadArtplayer).not.toHaveBeenCalled();
  });

  it("protects source/container/type options at runtime while preserving subtitle and quality", async () => {
    const rogueContainer = document.createElement("div");
    const customType = vi.fn();
    const quality = [{ html: "高清", url: "/high.mp4" }];
    const subtitle = { url: "/captions.vtt" };
    const wrapper = render({
      title: "示例预览",
      poster: "/poster.jpg",
      options: {
        container: rogueContainer,
        url: "/rogue",
        type: "flv",
        customType: { m3u8: customType },
        quality,
        subtitle,
      },
    });
    await flushPromises();
    const art = players[0]!;
    expect(art.option.container).toBe(
      wrapper.get('[data-slot="video-player-host"]').element,
    );
    expect(art.option.url).toBe("/sample.mp4");
    expect(art.option.type).toBe("native");
    expect(art.option.autoplay).toBe(false);
    expect(art.option.lang).toBe("zh-cn");
    expect(art.option.fullscreenWeb).toBe(true);
    expect(art.option.poster).toBe("/poster.jpg");
    expect(art.option.quality).toEqual(quality);
    expect(art.option.subtitle).toEqual(subtitle);
    expect(art.video.getAttribute("aria-label")).toBe("示例预览");
    expect(customType).not.toHaveBeenCalled();
    expect(runtime.loadHls).not.toHaveBeenCalled();
  });

  it("emits metadata, playback and progress without application requests", async () => {
    const wrapper = render();
    await flushPromises();
    const art = players[0]!;
    Object.defineProperties(art.video, {
      duration: { value: 90 },
      videoWidth: { value: 1920 },
      videoHeight: { value: 1080 },
    });
    art.video.currentTime = 15;
    art
      .emit("ready")
      .emit("video:loadedmetadata")
      .emit("video:timeupdate")
      .emit("video:play")
      .emit("video:ended");
    expect(wrapper.emitted("ready")?.[0]?.[0]).toBe(art);
    expect(wrapper.emitted("loadedmetadata")).toEqual([
      [{ duration: 90, width: 1920, height: 1080 }],
    ]);
    expect(wrapper.emitted("timeupdate")).toEqual([
      [{ currentTime: 15, duration: 90 }],
    ]);
    expect(wrapper.emitted("play")).toHaveLength(1);
    expect(wrapper.emitted("ended")).toHaveLength(1);
    await wrapper.vm.play();
    wrapper.vm.seek(24);
    expect(art.play).toHaveBeenCalledOnce();
    expect(art.seek).toBe(24);
  });

  it("destroys old media on source or option changes and ignores stale media events", async () => {
    const wrapper = render();
    await flushPromises();
    const old = players[0]!;
    await wrapper.setProps({ src: "/next.mp4" });
    await flushPromises();
    expect(old.pause).toHaveBeenCalledOnce();
    expect(old.destroy).toHaveBeenCalledWith(false);
    expect(old.video.load).toHaveBeenCalledOnce();
    old
      .emit("ready")
      .emit("video:loadedmetadata")
      .emit("video:error", new Error("stale"));
    expect(wrapper.emitted("ready")).toBeUndefined();
    expect(wrapper.emitted("error")).toBeUndefined();
    await wrapper.setProps({ options: { muted: true } });
    await flushPromises();
    expect(players[1]!.destroy).toHaveBeenCalledOnce();
    expect(players[2]!.option.muted).toBe(true);
    await wrapper.setProps({ active: false });
    expect(players[2]!.destroy).toHaveBeenCalledOnce();
    expect(wrapper.vm.getInstance()).toBeUndefined();
  });

  it("does not let an older module load create a stale player after a source change", async () => {
    const oldLoad = deferred<typeof FakeArt>();
    runtime.loadArtplayer.mockReturnValueOnce(oldLoad.promise);
    const wrapper = render({ src: "/old.mp4" });
    await wrapper.setProps({ src: "/latest.mp4" });
    await flushPromises();
    oldLoad.resolve(FakeArt);
    await flushPromises();
    expect(players.map((player) => player.option.url)).toEqual(["/latest.mp4"]);
  });

  it("does not create a player when unmounted during an asynchronous module load", async () => {
    const pending = deferred<typeof FakeArt>();
    runtime.loadArtplayer.mockReturnValueOnce(pending.promise);
    const wrapper = render();
    wrapper.unmount();
    pending.resolve(FakeArt);
    await flushPromises();
    expect(players).toHaveLength(0);
  });

  it("attaches Hls.js, ignores transient errors, and offers manual retry after fatal failure", async () => {
    const wrapper = render({ src: "/playlist.m3u8?token=test" });
    await flushPromises();
    const hls = decoders[0]!;
    expect(hls.loadSource).toHaveBeenCalledWith("/playlist.m3u8?token=test");
    expect(hls.attachMedia).toHaveBeenCalledWith(players[0]!.video);
    hls.error({ fatal: false, type: "networkError" });
    expect(wrapper.emitted("error")).toBeUndefined();
    hls.error({
      fatal: true,
      type: "networkError",
      details: "manifestLoadError",
    });
    await nextTick();
    expect(wrapper.get('[role="alert"]').text()).toContain("网络或跨域");
    expect(hls.destroy).toHaveBeenCalledOnce();
    await wrapper.get("button").trigger("click");
    await flushPromises();
    expect(wrapper.emitted("retry")).toHaveLength(1);
    expect(players[0]!.destroy).toHaveBeenCalledOnce();
    expect(decoders).toHaveLength(2);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("uses Safari native HLS when MediaSource is unsupported and reports unsupported browsers", async () => {
    hlsSupported = false;
    nativeHls = "probably";
    const wrapper = render({ src: "/stream", type: "hls" });
    await flushPromises();
    expect(players[0]!.video.getAttribute("src")).toBe("/stream");
    expect(decoders).toHaveLength(0);
    expect(wrapper.emitted("error")).toBeUndefined();
    nativeHls = "";
    await wrapper.setProps({ src: "/unsupported.m3u8" });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("不支持 HLS");
    expect(wrapper.emitted("error")?.[0]?.[0]).toMatchObject({
      code: "unsupported",
    });
  });

  it("releases HLS and prevents a pending decoder import attaching to stale media", async () => {
    const pending = deferred<typeof FakeHls>();
    runtime.loadHls.mockReturnValueOnce(pending.promise);
    const wrapper = render({ src: "/old.m3u8" });
    await flushPromises();
    await wrapper.setProps({ src: "/current.mp4" });
    await flushPromises();
    pending.resolve(FakeHls);
    await flushPromises();
    expect(decoders).toHaveLength(0);
    await wrapper.setProps({ src: "/new.m3u8" });
    await flushPromises();
    expect(decoders).toHaveLength(1);
    await wrapper.setProps({ active: false });
    expect(decoders[0]!.destroy).toHaveBeenCalledOnce();
  });

  it("ignores a deferred customType callback from an already destroyed source", async () => {
    const wrapper = render({ src: "/first.m3u8" });
    await flushPromises();
    const first = players[0]!;
    await wrapper.setProps({ src: "/second.m3u8" });
    await flushPromises();
    const currentDecoder = decoders[1]!;
    await first.option.customType.m3u8(first.video, "/first.m3u8", first);
    expect(currentDecoder.destroy).not.toHaveBeenCalled();
    expect(decoders).toHaveLength(2);
  });

  it("does not attach a late decoder after a native media failure", async () => {
    const pending = deferred<typeof FakeHls>();
    runtime.loadHls.mockReturnValueOnce(pending.promise);
    const wrapper = render({ src: "/failed.m3u8" });
    await flushPromises();
    players[0]!.emit("video:error", new Error("media failed"));
    pending.resolve(FakeHls);
    await flushPromises();
    expect(decoders).toHaveLength(0);
    expect(wrapper.get('[role="alert"]').text()).toContain("视频加载失败");
  });

  it("provides a readable native media failure and a recoverable module load failure", async () => {
    runtime.loadArtplayer.mockRejectedValueOnce(new Error("chunk load failed"));
    const wrapper = render();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("播放器加载失败");
    await wrapper.get("button").trigger("click");
    await flushPromises();
    Object.defineProperty(players[0]!.video, "error", { value: { code: 4 } });
    players[0]!.emit("video:error", new Error("MEDIA_ERR_SRC_NOT_SUPPORTED"));
    await nextTick();
    expect(wrapper.get('[role="alert"]').text()).toContain("不支持该视频格式");
  });

  it("treats screenshot CORS rejection as a non-fatal warning, preserving playback", async () => {
    const wrapper = render();
    await flushPromises();
    const art = players[0]!;
    art.screenshot.mockRejectedValueOnce(
      new DOMException("tainted canvas", "SecurityError"),
    );
    await expect(wrapper.vm.screenshot()).resolves.toBeUndefined();
    expect(wrapper.emitted("warning")?.[0]?.[0]).toMatchObject({
      code: "playback",
    });
    expect(wrapper.emitted("error")).toBeUndefined();
    expect(art.destroy).not.toHaveBeenCalled();
    expect(art.notice.show).toContain("正常播放不受影响");
    expect(art.controls.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "screenshot",
        click: expect.any(Function),
      }),
    );
  });

  it("destroys cached media on KeepAlive deactivation and restores it on activation", async () => {
    const shown = ref(true);
    const Container = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, {
          default: () =>
            shown.value ? h(VideoPlayer, { src: "/cached.m3u8" }) : null,
        }),
    });
    const wrapper = mount(Container);
    wrappers.push(wrapper);
    await flushPromises();
    expect(players).toHaveLength(1);
    shown.value = false;
    await flushPromises();
    expect(players[0]!.destroy).toHaveBeenCalledOnce();
    expect(decoders[0]!.destroy).toHaveBeenCalledOnce();
    shown.value = true;
    await flushPromises();
    expect(players).toHaveLength(2);
    expect(decoders).toHaveLength(2);
  });

  it("rejects detectable DASH and FLV sources explicitly", async () => {
    const wrapper = render({ src: "/manifest.mpd?token=1" });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("DASH 或 FLV");
    expect(runtime.loadArtplayer).not.toHaveBeenCalled();
  });
});

describe("VideoPlayer HLS detection", () => {
  it.each([
    ["/stream.m3u8", "auto", true],
    ["/stream.M3U8?token=1", "auto", true],
    [
      "/proxy?url=https%3A%2F%2Fexample.test%2Fstream.m3u8%3Ftoken%3D1",
      "auto",
      true,
    ],
    ["/movie.mp4?kind=m3u8", "auto", false],
    ["/movie.mp4", "hls", true],
    ["/stream.m3u8", "native", false],
  ] as const)("detects %s with %s mode", (src, type, expected) => {
    expect(isHlsSource(src, type)).toBe(expected);
  });
});
