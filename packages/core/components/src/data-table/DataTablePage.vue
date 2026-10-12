<script setup lang="ts">
defineOptions({ name: 'DataTablePage' })

withDefaults(defineProps<{
  class?: string
  mobileCards?: boolean
}>(), {
  mobileCards: false,
})
</script>

<template>
  <section :class="['min-w-0 space-y-3', $props.class]">
    <div v-if="$slots.toolbar" class="flex min-w-0 flex-wrap items-center gap-2">
      <slot name="toolbar" />
    </div>
    <div v-if="$slots.table" :class="mobileCards ? 'hidden sm:block' : undefined">
      <slot name="table" />
    </div>
    <div v-if="mobileCards && $slots.mobile" class="sm:hidden">
      <slot name="mobile" />
    </div>
    <slot v-if="!$slots.table && !mobileCards" />
  </section>
</template>
