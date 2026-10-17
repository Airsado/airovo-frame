<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TabsContentProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { TabsContent } from '@airovo/uikit-shadcnui'
import { cn } from '@airovo/uikit-shadcnui'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template>
    <TabsContent v-bind="forwarded" :class="cn('mt-0 flex-1 text-sm outline-none', props.class)">
        <slot />
    </TabsContent>
</template>
