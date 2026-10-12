<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
    class?: HTMLAttributes['class']
    orientation?: 'horizontal' | 'vertical'
}>(), { orientation: 'horizontal' })
</script>

<template>
    <div role="group" data-slot="button-group" :data-orientation="props.orientation" :class="cn('flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10', props.orientation === 'vertical' ? 'flex-col *:data-[slot=button]:rounded-b-none [&>*:last-child]:rounded-b-lg [&>*+*]:border-t-0' : '*:data-[slot=button]:rounded-r-none [&>*:last-child]:rounded-r-lg [&>*+*]:border-l-0', props.class)">
        <slot />
    </div>
</template>