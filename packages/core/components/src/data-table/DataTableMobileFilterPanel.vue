<script setup lang="ts">
import { ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'DataTableMobileFilterPanel' })

const props = withDefaults(defineProps<{
  compact?: boolean
  class?: HTMLAttributes['class']
}>(), {
  compact: false,
})

const open = ref(true)
</script>

<template>
  <Collapsible
    v-model:open="open"
    :class="[
      'bg-card/50 flex min-w-0 flex-col rounded-lg border p-2.5',
      open && (props.compact ? 'gap-2.5' : 'gap-2'),
      props.class,
    ]"
  >
    <CollapsibleContent>
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <slot />
      </div>
    </CollapsibleContent>
    <div :class="props.compact ? 'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-2' : 'flex items-center justify-end gap-1.5'">
      <CollapsibleTrigger as-child>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          :class="[
            'text-muted-foreground hover:text-foreground',
            props.compact ? 'size-9' : 'mr-auto size-7',
          ]"
          :aria-label="open ? '收起筛选' : '展开筛选'"
        >
          <ChevronDown :class="['transition-transform duration-200', props.compact ? 'size-4' : 'size-3.5', open && 'rotate-180']" aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <div
        role="group"
        aria-label="筛选操作"
        :class="[
          'flex items-center justify-end gap-1.5',
          props.compact && 'min-w-0 flex-wrap [&>button]:h-auto [&>button]:min-h-9 [&>button]:max-w-full [&>button]:[overflow-wrap:anywhere] [&>button]:whitespace-normal',
        ]"
      >
        <slot name="actions" />
      </div>
    </div>
  </Collapsible>
</template>
