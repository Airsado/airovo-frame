<script setup lang="ts">
/**
 * Highlight — syntax-highlighted code block.
 * TODO(v5): use Shiki (or Prism).
 */
defineOptions({ name: 'AirovoHighlight' })
withDefaults(defineProps<{
    code: string
    language?: 'ts' | 'js' | 'json' | 'vue' | 'bash' | 'css' | 'html'
    inline?: boolean
}>(), { language: 'ts', inline: false })
</script>
<template>
    <pre
        v-if="!inline"
        class="overflow-x-auto rounded-md border bg-card p-3 text-xs"
    ><code>{{ code }}</code></pre>
    <code
        v-else
        class="rounded border bg-card px-1 py-0.5 text-xs"
    >{{ code }}</code>
</template>
