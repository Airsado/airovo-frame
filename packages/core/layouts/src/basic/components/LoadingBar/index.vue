<script lang="ts" setup>
import { ref, watch } from 'vue'

/**
 * Top-of-page progress bar driven by `progress` (0-100).
 *
 * - `progress: 0`   → width: 0%   (invisible, fully transparent)
 * - `progress: 100` → width: 100% (full)
 * - Width animates via CSS transition (200ms ease-out) so progress
 *   bumps (e.g. 0 → 30 → 70 → 100) are visually smooth.
 * - When the bar reaches 100% it briefly holds, then fades out
 *   (opacity 200ms) and resets to 0% in the same transition — the
 *   user sees a clean "filled then dissolved" animation instead of a
 *   sudden disappearance.
 *
 * Renders unconditionally — always in the DOM, hidden by 0% width
 * + 0 opacity when idle.
 */
const props = defineProps<{
    /** Current progress, 0-100. */
    progress?: number
}>()

const width = ref(0)
const opacity = ref(0)

watch(
    () => props.progress ?? 0,
    (v) => {
        const clamped = Math.min(100, Math.max(0, v))
        if (clamped === 0) {
            // Reset: hide the bar
            opacity.value = 0
        } else {
            // Active: show the bar at the requested width
            opacity.value = 1
            width.value = clamped
        }
    },
    { immediate: true },
)
</script>

<template>
    <div
        class=""
        style="position: fixed; top: 0px; left: 0px; height: 2px; background: transparent; z-index: 2147483647; width: 100%; pointer-events: none;"
    >
        <div
            class=""
            :style="{
                height: '100%',
                background: 'var(--muted-foreground, hsl(0 0% 45.1%))',
                width: width + '%',
                opacity: opacity,
                color: 'var(--muted-foreground, hsl(0 0% 45.1%))',
                transition: 'width 200ms ease-out, opacity 250ms ease-in',
            }"
        >
            <div
                :style="{
                    boxShadow: '0 0 10px var(--muted-foreground, hsl(0 0% 45.1%)), 0 0 10px var(--muted-foreground, hsl(0 0% 45.1%))',
                    width: '5%',
                    opacity: 1,
                    position: 'absolute',
                    height: '100%',
                    transform: 'rotate(2deg) translate(0px, -2px)',
                    left: '-5.5%',
                }"
            />
        </div>
    </div>
</template>
