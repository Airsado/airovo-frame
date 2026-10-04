<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRequestClient } from '@airovo/app'

interface VideoRow { id: string; title: string; year?: number; auditStatus?: string; publishStatus?: string }
const loading = ref(true)
const rows = ref<VideoRow[]>([])
onMounted(async () => {
    try {
        const response = await getRequestClient().get<any>('/api/admin/videos?page=1&page_size=20')
        const data = response.data ?? response
        rows.value = data?.items ?? data?.list ?? []
    } finally { loading.value = false }
})
</script>

<template>
    <section class="flex flex-col gap-4 p-6">
        <div><h1 class="text-2xl font-semibold">视频管理</h1><p class="mt-1 text-sm text-muted-foreground">AirHaven 内容工作台基础接入。</p></div>
        <div class="overflow-hidden rounded-xl border bg-card">
            <div v-if="loading" class="p-6 text-sm text-muted-foreground">加载中…</div>
            <div v-else-if="!rows.length" class="p-10 text-center text-sm text-muted-foreground">暂无视频数据</div>
            <table v-else class="w-full text-left text-sm"><thead class="border-b bg-muted/40"><tr><th class="px-4 py-3">名称</th><th class="px-4 py-3">年份</th><th class="px-4 py-3">审核</th><th class="px-4 py-3">发布</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-b last:border-0"><td class="px-4 py-3 font-medium">{{ row.title }}</td><td class="px-4 py-3">{{ row.year || '-' }}</td><td class="px-4 py-3">{{ row.auditStatus || '-' }}</td><td class="px-4 py-3">{{ row.publishStatus || '-' }}</td></tr></tbody></table>
        </div>
    </section>
</template>
