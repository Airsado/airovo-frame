<script setup lang="ts">
/**
 * LazyLoad — IntersectionObserver swap of a placeholder for a real
 * image / component.
 */
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ name: 'AirovoLazyLoad' })
const props = withDefaults(defineProps<{
    src?: string
    placeholder?: string
    /** Threshold 0..1 — when the element becomes this fraction visible. */
    threshold?: number
    rootMargin?: string
}>(), { threshold: 0.1, rootMargin: '100px' })

const visible = ref(false)
const el = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function start() {
    if (!el.value) return
    observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                visible.value = true
                observer?.disconnect()
            }
        }
    }, { threshold: props.threshold, rootMargin: props.rootMargin })
    observer.observe(el.value)
}
function stop() { observer?.disconnect(); observer = null }
onMounted(start)
onBeforeUnmount(stop)
watch(() => el.value, (v) => { stop(); if (v) start() })
</script>
<template>
    <div ref="el" class="inline-block">
        <img
            v-if="visible && src"
            :src="src"
            :alt="placeholder"
            class="max-w-full"
        >
        <span
            v-else
            class="inline-block min-w-32 rounded border border-dashed bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground"
        >{{ placeholder ?? 'LazyLoad-stub' }}</span>
    </div>
</template>
