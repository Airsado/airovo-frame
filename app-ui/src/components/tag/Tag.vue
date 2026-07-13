<script setup lang="ts">
/**
 * Tag — colored chip with optional close button.
 * TODO(v5): icon slot + animation.
 */
defineOptions({ name: 'AirovoTag' })
withDefaults(defineProps<{
    label?: string
    tone?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning'
    closable?: boolean
}>(), { tone: 'default', closable: false })
const emit = defineEmits<{ close: [] }>()
</script>
<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
            tone === 'secondary' && 'bg-secondary text-secondary-foreground',
            tone === 'destructive' && 'bg-destructive/10 text-destructive border-destructive/30',
            tone === 'success' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
            tone === 'warning' && 'bg-amber-500/10 text-amber-700 border-amber-500/30',
            (tone === 'default' || !tone) && 'bg-card text-card-foreground',
        ]"
    >
        <slot>{{ label ?? 'Tag-stub' }}</slot>
        <button
            v-if="closable"
            type="button"
            class="opacity-60 hover:opacity-100"
            @click.stop="emit('close')"
        >×</button>
    </span>
</template>
