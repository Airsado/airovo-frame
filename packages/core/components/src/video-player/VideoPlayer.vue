<script setup lang="ts">
import type Artplayer from "artplayer";
import type Hls from "hls.js";
import type { ErrorData } from "hls.js";
import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { Button } from "../controls";
import { loadArtplayer, loadHls } from "./runtime";
import { isHlsSource, unsupportedSource } from "./source";
import { installSubtitleController } from "./subtitle-controller";
import type {
  VideoPlayerApi,
  VideoPlayerError,
  VideoPlayerMetadata,
  VideoPlayerOptions,
  VideoPlayerProgress,
  VideoPlayerType,
  VideoPlayerSubtitle,
} from "./types";

defineOptions({ name: "VideoPlayer" });
const props = withDefaults(
  defineProps<{
    src: string;
    poster?: string;
    title?: string;
    type?: VideoPlayerType;
    active?: boolean;
    options?: VideoPlayerOptions;
    subtitle?: VideoPlayerSubtitle;
  }>(),
  { type: "auto", active: true, title: "视频播放器" },
);

const emit = defineEmits<{
  ready: [instance: Artplayer];
  error: [error: VideoPlayerError];
  warning: [error: VideoPlayerError];
  loadedmetadata: [metadata: VideoPlayerMetadata];
  timeupdate: [progress: VideoPlayerProgress];
  play: [];
  pause: [];
  ended: [];
  retry: [];
}>();

const host = ref<HTMLDivElement>();
const initializing = ref(false);
const failure = shallowRef<VideoPlayerError>();
let mounted = false;
let suspended = false;
let revision = 0;
let instance: Artplayer | undefined;
let decoder: Hls | undefined;
let subtitles: ReturnType<typeof installSubtitleController> | undefined;

function destroyPlayer() {
  subtitles?.dispose();
  subtitles = undefined;
  decoder?.destroy();
  decoder = undefined;
  const previous = instance;
  instance = undefined;
  if (previous) {
    // Invalidate event callbacks before releasing media/network resources.
    previous.pause();
    previous.destroy(false);
    previous.video.removeAttribute("src");
    previous.video.load();
  }
  host.value?.replaceChildren();
}

function report(error: VideoPlayerError, request: number) {
  if (!mounted || request !== revision || failure.value) return;
  failure.value = error;
  initializing.value = false;
  instance?.pause();
  const failedDecoder = decoder;
  decoder = undefined;
  failedDecoder?.destroy();
  emit("error", error);
}

async function initialize() {
  const request = ++revision;
  destroyPlayer();
  failure.value = undefined;
  initializing.value = false;
  if (
    !mounted ||
    suspended ||
    !host.value ||
    !props.active ||
    !props.src.trim()
  )
    return;
  if (unsupportedSource(props.src, props.type)) {
    report(
      {
        code: "unsupported",
        message:
          "此播放器支持普通视频和 HLS，当前地址为 DASH 或 FLV，请选择可直接播放的线路。",
      },
      request,
    );
    return;
  }

  initializing.value = true;
  try {
    const Player = await loadArtplayer();
    if (!mounted || request !== revision || !host.value) return;

    let streamRevision = 0;
    const current = () =>
      mounted && !suspended && request === revision && !failure.value;
    const attachHls = async (video: HTMLVideoElement, url: string) => {
      // Artplayer defers customType callbacks; a destroyed source can invoke
      // its old callback after a newer player's decoder has already attached.
      if (!current()) return;
      const stream = ++streamRevision;
      decoder?.destroy();
      decoder = undefined;
      try {
        const HlsPlayer = await loadHls();
        if (!current() || stream !== streamRevision) return;
        if (HlsPlayer.isSupported()) {
          const hls = new HlsPlayer();
          decoder = hls;
          hls.on(HlsPlayer.Events.ERROR, (_event: string, data: ErrorData) => {
            if (!current() || stream !== streamRevision || !data.fatal) return;
            report(
              {
                code: data.type === "networkError" ? "network" : "media",
                message:
                  data.type === "networkError"
                    ? "视频加载失败，请检查播放地址、网络或跨域访问权限后重试。"
                    : "视频解码失败，当前浏览器可能不支持此音视频编码。",
                cause: data,
              },
              request,
            );
          });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari and iOS can play HLS without MediaSource / Hls.js.
          video.src = url;
        } else {
          report(
            {
              code: "unsupported",
              message:
                "当前浏览器不支持 HLS 播放，请使用支持 MediaSource 或原生 HLS 的浏览器。",
            },
            request,
          );
        }
      } catch (cause) {
        if (!current() || stream !== streamRevision) return;
        report(
          { code: "load", message: "HLS 播放模块加载失败，请重试。", cause },
          request,
        );
      }
    };

    // Runtime filtering also protects JS callers and cast/JSON configurations.
    const {
      container: _container,
      url: _url,
      type: _type,
      customType: _customType,
      ...options
    } = (props.options ?? {}) as VideoPlayerOptions & Record<string, unknown>;
    const art = new Player({
      lang: "zh-cn",
      autoplay: false,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      hotkey: true,
      mutex: true,
      playsInline: true,
      lock: true,
      ...options,
      // The controller handles initial captions too: the native constructor's
      // async subtitle init has neither cancellation nor rejection handling.
      subtitle: { ...(options.subtitle ?? {}), url: "" },
      subtitleOffset: false,
      // The native screenshot click drops its rejected promise on CORS failure.
      // Add the equivalent control below with a non-fatal, handled failure.
      screenshot: false,
      container: host.value,
      url: props.src.trim(),
      // Artplayer validates this as a required string after merging defaults.
      poster: props.poster ?? options.poster ?? "",
      type: isHlsSource(props.src, props.type) ? "m3u8" : "native",
      customType: { m3u8: attachHls },
    });
    instance = art;
    subtitles = installSubtitleController(
      art,
      Player.utils,
      current,
      (error) => emit("warning", error),
      options.subtitleOffset !== false,
    );
    void subtitles.apply(
      props.subtitle ?? (options.subtitle as VideoPlayerSubtitle | undefined),
    );
    art.video.setAttribute("aria-label", props.title);
    if (options.screenshot !== false) {
      art.controls.add({
        name: "screenshot",
        position: "right",
        index: 20,
        html: art.icons.screenshot,
        tooltip: art.i18n.get("Screenshot"),
        click: () => {
          void screenshot();
        },
      });
    }
    art.on("ready", () => {
      if (current()) emit("ready", art);
    });
    art.on("video:loadedmetadata", () => {
      if (current())
        emit("loadedmetadata", {
          duration: art.video.duration,
          width: art.video.videoWidth,
          height: art.video.videoHeight,
        });
    });
    art.on("video:timeupdate", () => {
      if (current())
        emit("timeupdate", {
          currentTime: art.video.currentTime,
          duration: art.video.duration,
        });
    });
    art.on("video:play", () => {
      if (current()) emit("play");
    });
    art.on("video:pause", () => {
      if (current()) emit("pause");
    });
    art.on("video:ended", () => {
      if (current()) emit("ended");
    });
    // Replace Artplayer's background reconnect timer: retry is explicit and
    // source changes must not leave an old instance fetching in the background.
    art.off("video:error");
    art.on("video:error", (cause) => {
      const code = art.video.error?.code;
      report(
        {
          code: code === 4 ? "unsupported" : code === 2 ? "network" : "media",
          message:
            code === 4
              ? "播放地址不可用，或当前浏览器不支持该视频格式。"
              : code === 3
                ? "视频解码失败，当前浏览器可能不支持此音视频编码。"
                : "视频加载失败，请检查播放地址、网络或跨域访问权限后重试。",
          cause,
        },
        request,
      );
    });
    initializing.value = false;
  } catch (cause) {
    report(
      { code: "load", message: "播放器加载失败，请重试。", cause },
      request,
    );
  }
}

function retry() {
  emit("retry");
  void initialize();
}

async function screenshot(name?: string): Promise<string | undefined> {
  const art = instance;
  if (!art) return;
  const request = revision;
  try {
    return await art.screenshot(name);
  } catch (cause) {
    if (mounted && request === revision) {
      const error: VideoPlayerError = {
        code: "playback",
        message: "截图失败，视频资源可能未允许跨域截图。正常播放不受影响。",
        cause,
      };
      art.notice.show = error.message;
      emit("warning", error);
    }
  }
}

defineExpose<VideoPlayerApi>({
  getInstance: () => instance,
  play: async () => {
    if (instance) await instance.play();
  },
  pause: () => instance?.pause(),
  seek: (seconds) => {
    if (instance && Number.isFinite(seconds))
      instance.seek = Math.max(0, seconds);
  },
  screenshot,
  retry,
});

onMounted(() => {
  mounted = true;
  void initialize();
});
onDeactivated(() => {
  suspended = true;
  revision++;
  destroyPlayer();
});
onActivated(() => {
  if (suspended) {
    suspended = false;
    void initialize();
  }
});
watch(
  () => [props.src, props.type, props.active, props.poster, props.options],
  () => {
    void initialize();
  },
  { deep: true, flush: "post" },
);
watch(
  () => props.subtitle,
  (subtitle) => {
    void subtitles?.apply(
      subtitle ?? (props.options?.subtitle as VideoPlayerSubtitle | undefined),
    );
  },
  { deep: true, flush: "post" },
);
watch(
  () => props.title,
  (title) => instance?.video.setAttribute("aria-label", title),
);
onBeforeUnmount(() => {
  mounted = false;
  revision++;
  destroyPlayer();
});
</script>

<template>
  <div
    data-slot="video-player"
    role="group"
    :aria-label="title"
    :aria-busy="initializing"
    class="relative isolate aspect-video min-h-40 w-full overflow-hidden bg-black text-white"
  >
    <div ref="host" data-slot="video-player-host" class="absolute inset-0" />
    <div
      v-if="failure"
      role="alert"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center"
    >
      <p class="max-w-lg text-sm leading-6">{{ failure.message }}</p>
      <Button variant="secondary" size="sm" @click="retry">重新加载</Button>
    </div>
    <div
      v-else-if="initializing"
      role="status"
      class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black text-sm text-white/75"
    >
      正在加载播放器…
    </div>
    <div
      v-else-if="!active || !src.trim()"
      role="status"
      class="absolute inset-0 flex items-center justify-center text-sm text-white/65"
    >
      {{ active ? "请选择播放内容" : "播放器已停止" }}
    </div>
  </div>
</template>
