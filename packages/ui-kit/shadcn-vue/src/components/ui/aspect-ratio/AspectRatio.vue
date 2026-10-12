<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AspectRatioProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { AspectRatio as AspectRatioRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AspectRatioProps & { class?: HTMLAttributes['class'] }>()
const forwarded = reactiveOmit(props, 'class')
</script>

<template>
    <AspectRatioRoot data-slot="aspect-ratio" v-bind="forwarded" :class="cn('relative', props.class)"><slot /></AspectRatioRoot>
</template>