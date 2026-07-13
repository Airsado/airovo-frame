<script setup lang="ts">
/**
 * BasicLayoutFullContent — layout variant with NO chrome (no header,
 * no sidebar). For pages that should fill the entire viewport
 * (login, error pages, full-screen apps, etc.). Toggle via route
 * meta `layout: 'full-content'`.
 */
defineOptions({ name: 'BasicLayoutFullContent' })
</script>
<template>
    <slot />
</template>
