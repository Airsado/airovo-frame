<script lang="ts" setup>
import { computed } from 'vue'

/**
 * Top-of-page progress bar.
 *
 * - `progress: 0`   → bar is **invisible** (opacity 0). No
 *   indeterminate pulse, no strip — the bar simply doesn't exist
 *   on the page when nothing is loading.
 * - `progress: 1..100` → bar fades in (opacity 250ms), width
 *   animates from current to `progress`% (200ms). The user sees
 *   a real, deterministic progress fill.
 * - `progress: 100` then `0` → bar fills to 100%, holds briefly,
 *   then fades out (opacity 250ms) and the inline width collapses
 *   to 0 in the same transition — clean "filled then dissolved"
 *   feedback instead of a sudden jump.
 *
 * `pointer-events: none` keeps the bar from intercepting clicks.
 */
const props = defineProps<{
    /** Current progress, 0-100. Drives the fill width. */
    progress?: number
}>()

const progressValue = computed(() => Math.min(100, Math.max(0, props.progress ?? 0)))
const isActive = computed(() => progressValue.value > 0)
const fillWidth = computed(() => `${progressValue.value}%`)
</script>

<template>
    <div
        v-show="isActive"
        class="loading-bar-root"
        style="position: fixed; top: 0px; left: 0; height: 2px; background: transparent; z-index: 2147483647; width: 100%; pointer-events: none;"
    >
        <div
            class="loading-bar-fill"
            :style="{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                background: 'var(--muted-foreground, hsl(0 0% 45.1%))',
                width: fillWidth,
                opacity: 1,
                // boxShadow: '0 0 10px var(--muted-foreground, hsl(0 0% 45.1%)), 0 0 5px var(--muted-foreground, hsl(0 0% 45.1%))',
                transition: 'width 200ms ease-out',
            }"
        />
    </div>
</template>
