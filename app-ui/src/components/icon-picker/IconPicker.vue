<script setup lang="ts">
/**
 * IconPicker — searchable Iconify icon picker.
 * TODO(v5): open a Dialog with an Iconify grid + search input.
 */
import { Icon } from '@iconify/vue'

defineOptions({ name: 'AirovoIconPicker' })
const props = defineProps<{
    modelValue?: string
    /** Iconify set prefix. Default: `lucide`. */
    iconSet?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()
function pick(v: string) { emit('update:modelValue', v) }
</script>
<template>
    <div class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm">
        <Icon
            v-if="modelValue"
            :icon="modelValue"
            class="size-4"
        />
        <span class="font-mono text-xs text-muted-foreground">{{ modelValue ?? 'IconPicker-stub' }}</span>
        <button
            type="button"
            class="ml-2 text-xs text-primary hover:underline"
            @click="pick(`${iconSet ?? 'lucide'}:circle`) "
        >pick</button>
    </div>
</template>
