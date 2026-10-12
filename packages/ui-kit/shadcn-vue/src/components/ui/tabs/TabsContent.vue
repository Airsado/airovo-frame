<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TabsContentProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { TabsContent } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template>
    <TabsContent
        data-slot="tabs-content"
        v-bind="forwarded"
        :class="cn('mt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring', props.class)"
    >
        <slot />
    </TabsContent>
</template>