<script setup lang="ts">
/**
 * NumberAnimation — animated count-up.
 * TODO(v5): use rAF easing (easeOutCubic).
 */
import { onMounted, ref, watch } from 'vue'

defineOptions({ name: 'AirovoNumberAnimation' })
const props = withDefaults(defineProps<{
    value: number
    duration?: number
    decimals?: number
}>(), { duration: 800, decimals: 0 })

const display = ref(0)
let raf: number | null = null
function tween(to: number) {
    if (raf) cancelAnimationFrame(raf)
    const from = display.value
    const start = performance.now()
    const step = (now: number) => {
        const t = Math.min(1, (now - start) / props.duration)
        display.value = from + (to - from) * t
        if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
}
onMounted(() => tween(props.value))
watch(() => props.value, (v) => tween(v))
</script>
<template>
    <span class="font-mono tabular-nums">{{ display.toFixed(decimals) }}</span>
</template>
