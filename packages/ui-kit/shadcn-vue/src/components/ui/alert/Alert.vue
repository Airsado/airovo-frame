<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
    variant?: 'default' | 'destructive'
    class?: HTMLAttributes['class']
}>(), { variant: 'default' })

const classes = computed(() => cn(
    'group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*=size-])]:size-4',
    props.variant === 'destructive'
        ? 'bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current'
        : 'bg-card text-card-foreground',
    props.class,
))
</script>

<template>
    <div data-slot="alert" role="alert" :class="classes">
        <slot />
    </div>
</template>