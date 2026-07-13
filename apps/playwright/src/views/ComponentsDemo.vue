<script lang="ts" setup>
import { ref } from 'vue'
import {
    UserCard,
    StatCard,
    StatusBadge,
    EmptyState,
    ResultPage,
} from '@airovo/app-ui'
import { Button } from '@airovo/uikit-shadcnui'

function onAdd() { globalThis.alert('新增') }

defineOptions({ name: 'ComponentsDemo' })

const showResult = ref(false)
</script>

<template>
    <div class="space-y-8 p-4 sm:p-6 lg:p-8">
        <header>
            <h1 class="text-2xl font-bold">业务组件库演示</h1>
            <p class="text-sm text-muted-foreground">
                @airovo/app-ui 提供的业务组件
            </p>
        </header>

        <section class="space-y-4">
            <h2 class="text-lg font-semibold">StatCard 数据统计</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="活跃用户" :value="1288" icon="lucide:users"
                    :trend="{ value: 12.4, direction: 'up', label: '较上周' }" />
                <StatCard title="今日订单" :value="268" icon="lucide:shopping-cart"
                    :trend="{ value: 5.1, direction: 'up', label: '较昨日' }" />
                <StatCard title="退出率" :value="3.2" icon="lucide:log-out"
                    :trend="{ value: 1.8, direction: 'down', label: '较上周', inverse: true }" />
                <StatCard title="总收入" value="¥ 8,820" icon="lucide:wallet"
                    :trend="{ value: 0, direction: 'flat', label: '持平' }" />
            </div>
        </section>

        <section class="space-y-4">
            <h2 class="text-lg font-semibold">UserCard 用户卡片</h2>
            <div class="grid gap-4 sm:grid-cols-2">
                <UserCard :user="{ name: '庄周', username: 'zhuang', email: 'z@airovo.dev', role: ['管理员', { label: 'VIP', tone: 'default' as const }] }">
                    <template #actions>
                        <Button variant="outline" size="sm">查看</Button>
                    </template>
                </UserCard>
                <UserCard :user="{ name: '李四', username: 'lisi', email: 'li@airovo.dev', role: '开发者' }" />
                <UserCard :user="{ name: '王五', username: 'wangwu', email: 'wang@airovo.dev', role: '访客' }" size="sm" />
                <UserCard :user="{ name: '赵六', username: 'zhaoliu', email: 'zhao@airovo.dev', role: ['运营', '编辑'] }" size="lg" />
            </div>
        </section>

        <section class="space-y-4">
            <h2 class="text-lg font-semibold">StatusBadge 状态徽章</h2>
            <div class="flex flex-wrap gap-2">
                <StatusBadge status="success" />
                <StatusBadge status="error" />
                <StatusBadge status="warning" />
                <StatusBadge status="processing" pulse />
                <StatusBadge status="pending" />
                <StatusBadge status="disabled" />
                <StatusBadge status="info" />
                <StatusBadge status="neutral" />
                <StatusBadge status="warning" text="需注意" />
            </div>
        </section>

        <section class="space-y-4">
            <h2 class="text-lg font-semibold">EmptyState 空状态</h2>
            <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-lg border bg-card">
                    <EmptyState
                        icon="lucide:inbox"
                        title="暂无数据"
                        description="请先添加一条记录"
                        action-text="新增记录"
                        @action="onAdd"
                    />
                </div>
                <div class="rounded-lg border bg-card">
                    <EmptyState
                        icon="lucide:search-x"
                        title="未找到匹配结果"
                        description="尝试使用其他关键词"
                        size="lg"
                    />
                </div>
            </div>
        </section>

        <section class="space-y-4">
            <h2 class="text-lg font-semibold">ResultPage 结果页</h2>
            <div class="grid gap-4 lg:grid-cols-2">
                <Button variant="outline" @click="showResult = !showResult">
                    {{ showResult ? '隐藏' : '显示' }} 404 页面
                </Button>
            </div>
            <div v-if="showResult" class="rounded-lg border bg-card overflow-hidden">
                <ResultPage status="404" primary-text="重新搜索" @primary="showResult = false" />
            </div>
        </section>
    </div>
</template>
