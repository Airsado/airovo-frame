<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
    const { params, query } = route
    const { path, _redirect_type: redirectType } = params

    // Replace any double slashes
    const normalizedPath = (path as string).replace('//', '/')

    const newQuery = { ...query, redirect: undefined }

    if (redirectType === 'path') {
        router.push({ path: normalizedPath, query: newQuery })
    } else {
        router.push({ path: normalizedPath, query })
    }
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <p class="text-muted-foreground">正在跳转...</p>
    </div>
</template>
