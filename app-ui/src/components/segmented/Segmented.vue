<script setup lang="ts">
/**
 * Segmented — mutually exclusive switcher.
 * TODO(v5): keyboard nav (←/→) and animation.
 */
defineOptions({ name: 'AirovoSegmented' })
defineProps<{
    options: Array<{ label: string; value: string | number }>
    modelValue: string | number
    block?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [v: string | number] }>()
</script>
<template>
    <div
        :class="[
            'inline-flex rounded-md border border-input bg-background p-0.5',
            block ? 'flex w-full' : '',
        ]"
    >
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="[
                'flex-1 rounded px-3 py-1 text-sm transition-colors',
                modelValue === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="emit('update:modelValue', opt.value)"
        >{{ opt.label }}</button>
    </div>
</template>
