<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TabsTriggerProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { TabsTrigger } from '@airovo/uikit-shadcnui'
import { cn } from '@airovo/uikit-shadcnui'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')

const baseClass = 'text-foreground/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring relative inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4'
const lineClass = 'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent'
const activeClass = 'data-[state=active]:bg-background data-[state=active]:text-foreground data-active:bg-background data-active:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground'
const indicatorClass = 'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100 group-data-[variant=line]/tabs-list:data-active:after:opacity-100'
</script>

<template>
    <TabsTrigger v-bind="forwarded" :class="cn(baseClass, lineClass, activeClass, indicatorClass, props.class)">
        <slot />
    </TabsTrigger>
</template>
