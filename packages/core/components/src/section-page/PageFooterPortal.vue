<script setup lang="ts">
import { inject } from 'vue'
import { pageFooterTargetKey } from './page-footer-context'

defineOptions({ name: 'PageFooterPortal' })

const target = inject(pageFooterTargetKey, null)
</script>

<template>
    <Teleport v-if="target" :to="target">
        <slot />
    </Teleport>
</template>
