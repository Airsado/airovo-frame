<script setup lang="ts">
defineProps<{
    required?: boolean
}>()
</script>

<template>
    <template v-if="required">
        <span
            data-slot="required-indicator"
            aria-hidden="true"
            class="ml-0.5 text-destructive"
            title="必填"
        >*</span>
        <span class="sr-only">必填</span>
    </template>
</template>
