<script setup lang="ts">
/**
 * LayoutDemo — shared placeholder for `meta.layout: 'mix'` and
 * `meta.layout: 'full-content'` routes. Shows the active route's
 * meta.layout value so you can see which layout variant rendered.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'LayoutDemo' })

const route = useRoute()
const layout = computed(() => (route.meta as { layout?: string }).layout ?? 'default')
</script>

<template>
    <div class="space-y-4 p-6">
        <header>
            <h1 class="text-2xl font-bold">Layout 演示</h1>
            <p class="text-sm text-muted-foreground">
                当前路由 <code>meta.layout</code> = <code>{{ layout }}</code>，由
                <code>LayoutHost</code> 解析。
            </p>
        </header>

        <section v-if="layout === 'mix'" class="space-y-3">
            <h2 class="text-base font-semibold">Mix Layout（双列）</h2>
            <p class="text-sm text-muted-foreground">
                这是 <code>BasicLayoutMix</code> 占位：水平顶部导航 + 子侧栏。
            </p>
        </section>

        <section v-else-if="layout === 'full-content'" class="space-y-3">
            <h2 class="text-base font-semibold">Full-Content Layout（无 chrome）</h2>
            <p class="text-sm text-muted-foreground">
                这是 <code>BasicLayoutFullContent</code>：整个视口都是页面内容，没有 header / sidebar。
            </p>
        </section>

        <section v-else>
            <p class="text-sm text-muted-foreground">
                此页面用的是默认 layout。<code>LayoutHost</code> 自动选了 <code>BasicLayout</code>。
            </p>
        </section>
    </div>
</template>
