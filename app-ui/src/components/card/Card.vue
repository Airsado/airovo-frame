<script setup lang="ts">
/**
 * Card — header/body/footer wrapper.
 * TODO(v5): swap for a proper shadcn-vue Card.
 */
defineOptions({ name: 'AirovoCard' })
defineProps<{ title?: string }>()
</script>
<template>
    <section class="rounded-md border bg-card p-4">
        <header
            v-if="title || $slots.extra"
            class="mb-3 flex items-center justify-between"
        >
            <h3 v-if="title" class="text-sm font-semibold">{{ title }}</h3>
            <slot name="extra" />
        </header>
        <slot />
        <footer v-if="$slots.footer" class="mt-3">
            <slot name="footer" />
        </footer>
    </section>
</template>
