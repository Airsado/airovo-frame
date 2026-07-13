<script setup lang="ts">
/**
 * PrintArea — print a designated DOM region with custom styles.
 * TODO(v5): inject a print stylesheet, then call `window.print()`.
 */
defineOptions({ name: 'AirovoPrintArea' })
const props = defineProps<{ selector: string; beforePrint?: () => void | Promise<void> }>()
async function go() {
    if (props.beforePrint) await props.beforePrint()
    window.print()
}
</script>
<template>
    <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
        @click="go"
    >Print-stub</button>
</template>
