<script lang="ts" setup>
import ComponentsDemo from './ComponentsDemo.vue'

type ComponentCategory =
  | 'all'
  | 'basic'
  | 'forms'
  | 'data'
  | 'feedback'
  | 'media'
  | 'layout'

const props = withDefaults(defineProps<{ category?: ComponentCategory }>(), {
  category: 'all',
})
</script>

<template>
  <ComponentsDemo :category="props.category" />
</template>
