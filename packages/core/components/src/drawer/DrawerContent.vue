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
  side?: 'bottom' | 'right'
}>(), {
  showHandle: true,
  side: 'bottom',
})
const emits = defineEmits<DialogContentEmits>()
const delegatedProps = reactiveOmit(props, 'class', 'showHandle', 'side')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DrawerOverlay />
    <DialogContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(
        'bg-background text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col overflow-hidden text-sm shadow-lg outline-none will-change-transform duration-200',
        props.side === 'right'
          ? 'inset-y-0 right-0 h-full w-[min(100%,28rem)] max-w-[90vw] rounded-l-xl border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
          : 'inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        props.class,
      )"
    >
      <div v-if="showHandle && props.side === 'bottom'" data-slot="drawer-handle" class="bg-muted mx-auto mt-3 h-1 w-24 shrink-0 rounded-full" />
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
