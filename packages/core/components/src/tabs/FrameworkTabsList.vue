<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TabsListProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { TabsList } from '@airovo/uikit-shadcnui'
import { cn } from '@airovo/uikit-shadcnui'

interface Props extends TabsListProps {
    class?: HTMLAttributes['class']
    variant?: 'default' | 'line'
}

const props = withDefaults(defineProps<Props>(), { variant: 'default' })
const forwarded = reactiveOmit(props, 'class', 'variant')
const baseClass = 'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none'
</script>

<template>
    <TabsList
        v-bind="forwarded"
        :data-variant="props.variant"
        :class="cn(baseClass, props.variant === 'line' ? 'gap-1 bg-transparent' : 'bg-muted', props.class)"
    >
        <slot />
    </TabsList>
</template>
