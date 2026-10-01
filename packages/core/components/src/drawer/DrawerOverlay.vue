<script setup lang="ts">
import type { DialogOverlayProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogOverlay } from 'reka-ui'
import { cn } from '@airovo/uikit-shadcnui'

const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <DialogOverlay
    data-slot="drawer-overlay"
    v-bind="delegatedProps"
    :class="cn('fixed inset-0 z-50 bg-black/10 supports-[backdrop-filter]:backdrop-blur-xs', props.class)"
  >
    <slot />
  </DialogOverlay>
</template>
