<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRequestClient } from '@airovo/app'
interface CollectionTask { id: string; name?: string; status?: string }
const loading = ref(true); const tasks = ref<CollectionTask[]>([])
onMounted(async () => { try { const response = await getRequestClient().get<any>('/api/admin/collection/tasks'); const data = response.data ?? response; tasks.value = Array.isArray(data) ? data : [] } finally { loading.value = false } })
</script>

<template><section class="flex flex-col gap-4 p-6"><div><h1 class="text-2xl font-semibold">采集管理</h1><p class="mt-1 text-sm text-muted-foreground">采集站、任务、分类映射和实时日志将在同一工作台完成。</p></div><div v-if="loading" class="rounded-xl border bg-card p-6 text-sm text-muted-foreground">加载中…</div><div v-else class="grid gap-4 md:grid-cols-3"><div v-for="task in tasks" :key="task.id" class="rounded-xl border bg-card p-5"><div class="font-medium">{{ task.name || `任务 ${task.id}` }}</div><div class="mt-2 text-sm text-muted-foreground">状态：{{ task.status || '-' }}</div></div><div class="flex min-h-32 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">+ 新建采集任务</div></div></section></template>
