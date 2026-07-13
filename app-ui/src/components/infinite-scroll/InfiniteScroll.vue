<script setup lang="ts">
/**
 * InfiniteScroll — IntersectionObserver sentinel that calls onLoad
 * when the bottom becomes visible.
 */
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ name: 'AirovoInfiniteScroll' })
const props = withDefaults(defineProps<{
    distance?: number
    /** Disable further triggers while the parent is fetching. */
    loading?: boolean
    /** Stop triggering after this many hits (pagination cursor). */
    maxPages?: number
}>(), { distance: 0, maxPages: Infinity })
const emit = defineEmits<{ load: [] }>()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let page = 0

function start() {
    if (!sentinel.value) return
    observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting && !props.loading && page < props.maxPages) {
                page++
                emit('load')
            }
        }
    }, { rootMargin: `0px 0px ${props.distance}px 0px` })
    observer.observe(sentinel.value)
}
function stop() { observer?.disconnect(); observer = null }
onMounted(start)
onBeforeUnmount(stop)
watch(() => sentinel.value, (v) => { stop(); if (v) start() })
</script>
<template>
    <div>
        <slot />
        <div ref="sentinel" class="h-4" aria-hidden="true" />
    </div>
</template>
