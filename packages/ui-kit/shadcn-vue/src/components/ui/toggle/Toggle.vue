<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ToggleEmits, ToggleProps } from 'reka-ui'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Toggle as ToggleRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ToggleProps & {
    class?: HTMLAttributes['class']
    variant?: 'default' | 'outline'
    size?: 'default' | 'sm' | 'lg'
}>(), { variant: 'default', size: 'default' })
const emits = defineEmits<ToggleEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'variant', 'size'), emits)
const classes = computed(() => cn(
    'group/toggle inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted',
    props.variant === 'outline' && 'border border-input bg-transparent',
    props.size === 'sm' && 'h-7 min-w-7 rounded-md px-2.5 text-[0.8rem]',
    props.size === 'lg' && 'h-9 min-w-9 px-2.5',
    props.size === 'default' && 'h-8 min-w-8 px-2.5',
    props.class,
))
</script>

<template>
    <ToggleRoot data-slot="toggle" v-bind="forwarded" :class="classes"><slot /></ToggleRoot>
</template>