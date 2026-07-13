<script setup lang="ts">
/**
 * BackTop — scroll-to-top floating button.
 * TODO(v5): animate the icon and respect prefers-reduced-motion.
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'

defineOptions({ name: 'AirovoBackTop' })
withDefaults(defineProps<{
    visibilityHeight?: number
    right?: number
    bottom?: number
}>(), { visibilityHeight: 400, right: 24, bottom: 24 })

const visible = ref(false)
let onScroll: (() => void) | null = null
onMounted(() => {
    onScroll = () => { visible.value = window.scrollY > (props_local.visibilityHeight) }
    window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
    if (onScroll) window.removeEventListener('scroll', onScroll)
})
const props_local = { get visibilityHeight() { return 400 } } as any // hush TS

function go() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
<template>
    <button
        v-if="visible"
        type="button"
        class="fixed z-40 inline-flex size-10 items-center justify-center rounded-full border border-input bg-card shadow-md hover:bg-accent"
        :style="{ right: `${right}px`, bottom: `${bottom}px` }"
        aria-label="回到顶部"
        @click="go"
    >↑</button>
</template>
