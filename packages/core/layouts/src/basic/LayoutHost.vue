<script setup lang="ts">
/**
 * LayoutHost — picks the right layout based on `route.meta.layout`.
 *
 * Apps use this in place of `<BasicLayout>` to opt in to the
 * multi-layout system. Falls back to BasicLayout when no
 * `meta.layout` is set, so existing apps are unaffected.
 *
 * Supported values of `meta.layout`:
 *   - 'mix'           → BasicLayoutMix (header-nav + sidebar skeleton)
 *   - 'full-content'  → BasicLayoutFullContent (no chrome)
 *   - undefined/other → BasicLayout (default)
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BasicLayout from './layout.vue'
import BasicLayoutMix from './layouts/mix.vue'
import BasicLayoutFullContent from './layouts/full-content.vue'

defineOptions({ name: 'BasicLayoutHost' })

const route = useRoute()
const Layout = computed(() => {
    const key = (route.meta as { layout?: string } | undefined)?.layout
    if (key === 'mix') return BasicLayoutMix
    if (key === 'full-content') return BasicLayoutFullContent
    return BasicLayout
})
</script>

<template>
    <component :is="Layout">
        <slot />
    </component>
</template>
