<script lang="ts" setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- The parent route only owns the navigation node. Each category is a
       child route so the shell can expose a clear component-oriented menu. -->
  <RouterView />
</template>
