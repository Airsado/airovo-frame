<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

defineOptions({ name: 'DrawerSection' })

const props = defineProps<{
    class?: HTMLAttributes['class']
}>()
</script>

<template>
    <section :class="['flex flex-col gap-4 border-b border-border/60 pb-6 last:border-b-0 last:pb-0', props.class]">
        <slot />
    </section>
</template>
