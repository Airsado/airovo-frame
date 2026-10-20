import type Artplayer from "artplayer";
import { subtitleOptions } from "./subtitle";
import type { VideoPlayerError, VideoPlayerSubtitle } from "./types";

/** Artplayer's native subtitle loader has no AbortSignal or request identity. */
export function installSubtitleController(
  art: Artplayer,
  utils: Pick<typeof Artplayer.utils, "srtToVtt" | "assToVtt">,
  current: () => boolean,
  warning: (error: VideoPlayerError) => void,
  allowOffset = true,
) {
  let generation = 0;
  let disposed = false;
  let request: AbortController | undefined;
  let queue = Promise.resolve();
  let activeBlob: string | undefined;
  const pendingBlobs = new Set<string>();
  const visibleName = "external-subtitle-visible";
  const offsetName = "external-subtitle-offset";
  const valid = (cycle: number) =>
    !disposed && current() && cycle === generation;
  const removeSetting = (name: string) => {
    if (art.setting.find(name)) art.setting.remove(name);
  };
  function clear(): void {
    const track = art.template.$track;
    track.onload = null;
    track.onerror = null;
    track.removeAttribute("src");
    if (art.subtitle.textTrack) art.subtitle.textTrack.mode = "disabled";
    art.template.$subtitle.replaceChildren();
    art.subtitle.show = false;
    removeSetting(visibleName);
    removeSetting(offsetName);
    if (activeBlob) URL.revokeObjectURL(activeBlob);
    activeBlob = undefined;
  }
  function controls(): void {
    art.setting.update({
      name: visibleName,
      html: "显示外挂字幕",
      switch: art.subtitle.show,
      onSwitch(item) {
        if (!disposed && current()) art.subtitle.show = !item.switch;
        return art.subtitle.show;
      },
    });
    if (allowOffset)
      art.setting.update({
        name: offsetName,
        html: "字幕时间偏移",
        tooltip: "0s",
        range: [0, -10, 10, 0.1],
        onChange(item) {
          if (!disposed && current())
            art.subtitleOffset = Number(item.range?.[0] ?? 0);
          return `${art.subtitleOffset}s`;
        },
      });
  }
  function report(cause: unknown, cycle: number): void {
    if (!valid(cycle)) return;
    const error: VideoPlayerError = {
      code: "subtitle",
      message: "字幕加载失败，请检查地址、格式或跨域权限。正常播放不受影响。",
      cause,
    };
    art.notice.show = error.message;
    warning(error);
  }
  async function apply(value?: VideoPlayerSubtitle): Promise<void> {
    const cycle = ++generation;
    request?.abort();
    request = undefined;
    if (!valid(cycle)) return;
    const options = subtitleOptions(value);
    if (!options) {
      clear();
      queue = queue.then(() => {
        if (valid(cycle)) clear();
      });
      return;
    }
    const controller = new AbortController();
    request = controller;
    try {
      const response = await fetch(options.url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Subtitle HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (!valid(cycle) || controller.signal.aborted) return;
      const text = new TextDecoder(options.encoding).decode(bytes);
      const vtt =
        options.type === "srt"
          ? utils.srtToVtt(text)
          : options.type === "ass"
            ? utils.assToVtt(text)
            : text;
      if (!/^\uFEFF?WEBVTT(?:\s|$)/.test(vtt))
        throw new Error("Invalid WebVTT subtitle");
      const sourceBlob = URL.createObjectURL(
        new Blob([vtt], { type: "text/vtt" }),
      );
      pendingBlobs.add(sourceBlob);
      // Only the short local Blob load reaches Artplayer. Serial installation
      // means an older native switch can never overwrite a newer installed one.
      queue = queue
        .then(async () => {
          if (!valid(cycle)) return;
          const visible = art.setting.find(visibleName)
            ? art.subtitle.show
            : true;
          try {
            const installed = await art.subtitle.switch(sourceBlob, {
              ...options,
              name: "",
              type: "vtt",
              encoding: "utf-8",
              escape: true,
              onVttLoad(text) {
                if (!valid(cycle))
                  throw new DOMException(
                    "Stale subtitle request",
                    "AbortError",
                  );
                return text;
              },
            });
            if (!valid(cycle)) {
              if (installed?.startsWith("blob:"))
                URL.revokeObjectURL(installed);
              return;
            }
            if (!installed) throw new Error("Text tracks are unavailable");
            activeBlob = installed;
            art.option.subtitle = { ...art.option.subtitle, escape: true };
            art.subtitle.show = visible;
            controls();
            const track = art.template.$track;
            const loaded = track.onload;
            track.onload = (event) => {
              if (valid(cycle)) {
                loaded?.call(track, event);
                if (allowOffset) art.subtitleOffset = 0;
              }
            };
            track.onerror = (event) => report(event, cycle);
          } catch (cause) {
            report(cause, cycle);
          }
        })
        .finally(() => {
          URL.revokeObjectURL(sourceBlob);
          pendingBlobs.delete(sourceBlob);
        });
      await queue;
    } catch (cause) {
      if (!controller.signal.aborted) report(cause, cycle);
    }
  }
  return {
    apply,
    dispose: () => {
      disposed = true;
      generation++;
      request?.abort();
      art.template.$track.onload = null;
      art.template.$track.onerror = null;
      for (const url of pendingBlobs) URL.revokeObjectURL(url);
      pendingBlobs.clear();
      if (activeBlob) URL.revokeObjectURL(activeBlob);
      activeBlob = undefined;
    },
  };
}
