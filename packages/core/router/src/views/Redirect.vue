<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()

onMounted(() => {
    const { path } = route.params
    const target = Array.isArray(path) ? path.join('/') : (path as string)
    router.replace('/' + target)
})
</script>

<template>
    <div class="flex items-center justify-center p-8 text-muted-foreground">
        Redirecting...
    </div>
</template>
