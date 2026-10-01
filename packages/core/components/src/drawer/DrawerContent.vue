<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@airovo/uikit-shadcnui'
import DrawerOverlay from './DrawerOverlay.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DialogContentProps & {
  class?: HTMLAttributes['class']
  showHandle?: boolean
}>(), {
  showHandle: true,
})
const emits = defineEmits<DialogContentEmits>()
const delegatedProps = reactiveOmit(props, 'class', 'showHandle')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DrawerOverlay />
    <DialogContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('bg-background text-foreground fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-xl border-t text-sm shadow-lg outline-none will-change-transform', props.class)"
    >
      <div v-if="showHandle" data-slot="drawer-handle" class="bg-muted mx-auto mt-3 h-1 w-24 shrink-0 rounded-full" />
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
