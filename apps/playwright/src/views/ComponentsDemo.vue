<script lang="ts" setup>
import { ref } from 'vue'
import {
    DataPanel,
    DataTable,
    DatePicker,
    DateTimePicker,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    EmptyState,
    FacetedFilter,
    FilterBar,
    MetricStrip,
    PageContainer,
    ResultPage,
    SectionPage,
    StatCard,
    StatusBadge,
    UserCard,
    type DataTableColumn,
} from '@airovo/components'
import { PermissionButton } from '@airovo/permission'
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    NativeSelect,
    NativeSelectOption,
} from '@airovo/uikit-shadcnui'
import { SelectBox, SearchSelect } from '@airovo/components'
import { useModal } from '@airovo/composables'
import { ServiceHealthCard } from '@airovo/app-ui'

function onAdd() {
    globalThis.alert('新增')
}

defineOptions({ name: 'ComponentsDemo' })

const showResult = ref(false)
const search = ref('')
const showDialog = ref(false)
const showDrawer = ref(false)
const selectedDate = ref<Date>()
const selectedDateTime = ref<Date>()
const selectedProvider = ref<string | undefined>('openai')
const selectedRegion = ref('us-east')
const searchedProvider = ref<string | undefined>()
const selectedChannelStatus = ref<string | undefined>()
const selectedChannelTypes = ref<string[]>([])
const providerOptions = [
    { label: 'OpenAI 主渠道', value: 'openai' },
    { label: 'Claude 备用渠道', value: 'claude' },
    { label: '本地 Ollama（禁用）', value: 'ollama', disabled: true },
]
const channelStatusOptions = [
    { label: '运行中', value: 'enabled', count: 24 },
    { label: '已停用', value: 'disabled', count: 3 },
    { label: '自动停用', value: 'auto-disabled', count: 1 },
]
const channelTypeOptions = [
    { label: 'OpenAI 兼容', value: 'openai', count: 12 },
    { label: 'Claude', value: 'claude', count: 8 },
    { label: 'Ollama', value: 'ollama', count: 5 },
    { label: '自定义', value: 'custom', count: 3 },
]
function resetChannelFilters(): void {
    selectedChannelStatus.value = undefined
    selectedChannelTypes.value = []
}
const [DemoModal, demoModalApi] = useModal({
    title: '保存设置',
    description: '这是框架内置 ModalApi 的确认流程。',
    onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 350))
    },
})
const demoMetrics = [
    {
        key: 'requests',
        label: '请求数',
        value: '18,240',
        hint: '过去 24 小时',
        icon: 'lucide:activity',
        tone: 'info' as const,
    },
    {
        key: 'success',
        label: '成功率',
        value: '99.2%',
        hint: '较昨日 +0.8%',
        icon: 'lucide:check-circle-2',
        tone: 'success' as const,
    },
    {
        key: 'latency',
        label: '平均延迟',
        value: '284 ms',
        hint: 'P95 612 ms',
        icon: 'lucide:gauge',
    },
    {
        key: 'tokens',
        label: 'Token 消耗',
        value: '2.48M',
        hint: '本月累计',
        icon: 'lucide:coins',
        tone: 'warning' as const,
    },
]
const tableRows = [
    { id: 1, name: 'StatCard', category: '数据展示', purpose: '汇总指标' },
    { id: 2, name: 'StatusBadge', category: '状态展示', purpose: '标识状态' },
    { id: 3, name: 'DataTable', category: '数据展示', purpose: '展示列表' },
]
const coreTableColumns: DataTableColumn[] = [
    { key: 'name', title: '组件', sortable: true },
    { key: 'category', title: '类别', sortable: true },
    { key: 'purpose', title: '用途' },
]
</script>

<template>
    <PageContainer class="min-h-full">
        <template #breadcrumb
            ><span class="text-xs text-muted-foreground"
                >开发者工具 / framework-ui</span
            ></template
        >
        <template #title>框架组件库演示</template>
        <template #description
            >@airovo/components
            提供的通用后台组件；页面骨架和基础交互由框架包提供。</template
        >
        <div class="space-y-8">
            <section class="space-y-4">
                <h2 class="text-lg font-semibold">New API 风格页面骨架</h2>
                <SectionPage
                    class="min-h-96 rounded-lg border"
                    :stack-actions-on-mobile="true"
                >
                    <template #breadcrumb>
                        <div class="text-xs text-muted-foreground">
                            控制台 / 运营概览
                        </div>
                    </template>
                    <template #title>
                        <h3
                            class="truncate text-base font-semibold tracking-tight"
                        >
                            运营概览
                        </h3>
                    </template>
                    <template #description
                        >面向模型调用、渠道和额度的统一工作区。</template
                    >
                    <template #actions>
                        <Button size="sm" variant="outline">导出报表</Button>
                        <PermissionButton requires-auth size="sm" @click="onAdd">权限操作</PermissionButton>
                    </template>
                    <div class="space-y-3">
                        <MetricStrip :metrics="demoMetrics" />
                        <DataPanel>
                            <template #toolbar>
                                <FilterBar
                                    v-model="search"
                                    placeholder="搜索渠道或模型"
                                >
                                    <template #filters>
                                        <Badge variant="outline"
                                            >全部状态</Badge
                                        >
                                        <Badge variant="outline"
                                            >过去 7 天</Badge
                                        >
                                    </template>
                                    <template #actions>
                                        <Button size="sm" variant="ghost"
                                            >刷新</Button
                                        >
                                    </template>
                                </FilterBar>
                            </template>
                            <div class="grid gap-3 p-4 sm:grid-cols-2">
                                <div
                                    v-for="item in [
                                        'OpenAI 主渠道',
                                        'Claude 备用渠道',
                                    ]"
                                    :key="item"
                                    class="rounded-md border p-3"
                                >
                                    <div
                                        class="flex items-center justify-between gap-2"
                                    >
                                        <span class="font-medium">{{
                                            item
                                        }}</span>
                                        <StatusBadge
                                            status="success"
                                            text="运行中"
                                        />
                                    </div>
                                    <p
                                        class="mt-2 text-xs text-muted-foreground"
                                    >
                                        最近 24 小时成功率 99.2%
                                    </p>
                                </div>
                            </div>
                        </DataPanel>
                    </div>
                </SectionPage>
            </section>

            <section class="space-y-4">
                <div>
                    <h2 class="text-lg font-semibold">app-ui 业务扩展示例</h2>
                    <p class="text-sm text-muted-foreground">
                        业务语义组件通过公开的框架组件组合，不修改框架内置实现。
                    </p>
                </div>
                <div class="grid gap-4 md:grid-cols-3">
                    <ServiceHealthCard
                        name="主 API 网关"
                        description="面向应用请求的统一入口。"
                        :metrics="[
                            { label: '可用率', value: '99.98%' },
                            { label: 'P95 延迟', value: '284 ms' },
                        ]"
                    />
                    <ServiceHealthCard
                        name="异步任务队列"
                        health="degraded"
                        :metrics="[
                            { label: '待处理', value: 18 },
                            { label: '最近错误', value: 2 },
                        ]"
                    >
                        <template #actions>
                            <Button size="sm" variant="outline">查看任务</Button>
                        </template>
                    </ServiceHealthCard>
                    <ServiceHealthCard
                        name="报表服务"
                        health="offline"
                        description="演示业务组件的状态和操作插槽。"
                    >
                        <template #actions>
                            <Button size="sm" variant="outline">重试</Button>
                        </template>
                    </ServiceHealthCard>
                </div>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">Dialog、Modal 与日期组件</h2>
                <div class="grid gap-4 lg:grid-cols-2">
                    <div
                        class="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <div>
                            <p class="font-medium">Dialog</p>
                            <p class="text-sm text-muted-foreground">
                                标准模态对话框，保留标题、说明和底部操作插槽。
                            </p>
                        </div>
                        <Button class="w-fit" @click="showDialog = true"
                            >打开 Dialog</Button
                        >
                        <Dialog v-model:open="showDialog">
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>编辑渠道</DialogTitle>
                                    <DialogDescription
                                        >修改后会在下一次请求时生效。</DialogDescription
                                    >
                                </DialogHeader>
                                <Input
                                    model-value="OpenAI 主渠道"
                                    aria-label="渠道名称"
                                />
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        @click="showDialog = false"
                                        >取消</Button
                                    >
                                    <Button @click="showDialog = false"
                                        >保存</Button
                                    >
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div
                        class="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <div>
                            <p class="font-medium">useModal / ModalApi</p>
                            <p class="text-sm text-muted-foreground">
                                通过 API 控制打开、确认、取消和 loading 状态。
                            </p>
                        </div>
                        <Button class="w-fit" @click="demoModalApi.open()"
                            >打开 Modal</Button
                        >
                        <DemoModal>
                            <template #default="{ data }">
                                <p class="text-sm text-muted-foreground">
                                    当前数据：{{ data ?? '无' }}
                                </p>
                            </template>
                        </DemoModal>
                    </div>
                    <div
                        class="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <p class="font-medium">DatePicker</p>
                        <DatePicker v-model="selectedDate" />
                        <p class="text-xs text-muted-foreground">
                            {{
                                selectedDate?.toLocaleString('zh-CN') ??
                                '尚未选择'
                            }}
                        </p>
                    </div>
                    <div
                        class="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <div>
                            <p class="font-medium">Drawer</p>
                            <p class="text-sm text-muted-foreground">
                                底部抽屉提供固定头尾和独立可滚动内容区。
                            </p>
                        </div>
                        <Button class="w-fit" @click="showDrawer = true">打开 Drawer</Button>
                        <Drawer v-model:open="showDrawer">
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>渠道详情</DrawerTitle>
                                    <DrawerDescription>这是框架组件包提供的底部 Drawer。</DrawerDescription>
                                </DrawerHeader>
                                <DrawerBody class="space-y-3 pb-4">
                                    <p v-for="item in 4" :key="item" class="rounded-md border p-3 text-sm">
                                        可滚动内容 {{ item }}：保持头部和底部操作区固定。
                                    </p>
                                </DrawerBody>
                                <DrawerFooter>
                                    <Button @click="showDrawer = false">完成</Button>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    </div>
                    <div
                        class="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <p class="font-medium">DateTimePicker</p>
                        <DateTimePicker v-model="selectedDateTime" />
                        <p class="text-xs text-muted-foreground">
                            {{
                                selectedDateTime?.toLocaleString('zh-CN') ??
                                '尚未选择'
                            }}
                        </p>
                    </div>
                </div>
            </section>

            <section class="space-y-4">
                <div>
                    <h2 class="text-lg font-semibold">Select 下拉选择</h2>
                    <p class="text-sm text-muted-foreground">
                        基础 Select 与搜索下拉沿用 new-api 的圆角、紧凑间距和弹层动效；
                        FacetedFilter 复刻 /channels 工具栏的虚线触发器、勾选项、数量和清除筛选。
                    </p>
                </div>
                <div class="flex flex-col gap-5 rounded-lg border bg-card p-4">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Input class="w-full sm:w-52" placeholder="按名称、ID 或 Key 筛选" />
                        <FacetedFilter
                            v-model="selectedChannelStatus"
                            title="状态"
                            :options="channelStatusOptions"
                            single-select
                            search-placeholder="搜索状态"
                        />
                        <FacetedFilter
                            v-model="selectedChannelTypes"
                            title="类型"
                            :options="channelTypeOptions"
                            search-placeholder="搜索渠道类型"
                        />
                        <Button variant="ghost" size="sm" class="text-muted-foreground" @click="resetChannelFilters">
                            重置
                        </Button>
                    </div>
                    <p class="text-xs text-muted-foreground">
                        /channels 筛选值：状态 {{ selectedChannelStatus ?? '全部' }}；类型
                        {{ selectedChannelTypes.length ? selectedChannelTypes.join('、') : '全部' }}
                    </p>
                    <div class="grid gap-4 md:grid-cols-3">
                        <label class="flex flex-col gap-1.5 text-sm">
                        <span class="text-xs font-medium text-muted-foreground">渠道（SelectBox）</span>
                        <SelectBox
                            v-model="selectedProvider"
                            :options="providerOptions"
                            allow-clear
                            placeholder="选择渠道"
                        />
                        <span class="text-xs text-muted-foreground">当前值：{{ selectedProvider ?? '未选择' }}</span>
                        </label>
                        <label class="flex flex-col gap-1.5 text-sm">
                        <span class="text-xs font-medium text-muted-foreground">区域（NativeSelect）</span>
                        <NativeSelect v-model="selectedRegion" class="w-full">
                            <NativeSelectOption value="us-east">US East</NativeSelectOption>
                            <NativeSelectOption value="eu-west">EU West</NativeSelectOption>
                            <NativeSelectOption value="ap-southeast">AP Southeast</NativeSelectOption>
                        </NativeSelect>
                        <span class="text-xs text-muted-foreground">当前值：{{ selectedRegion }}</span>
                        </label>
                        <label class="flex flex-col gap-1.5 text-sm">
                        <span class="text-xs font-medium text-muted-foreground">可搜索渠道（SearchSelect）</span>
                        <SearchSelect
                            v-model="searchedProvider"
                            :options="providerOptions"
                            search-placeholder="搜索渠道名称"
                            placeholder="搜索并选择渠道"
                        />
                        <span class="text-xs text-muted-foreground">当前值：{{ searchedProvider ?? '未选择' }}</span>
                        </label>
                    </div>
                </div>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">StatCard 数据统计</h2>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="活跃用户"
                        :value="1288"
                        icon="lucide:users"
                        :trend="{
                            value: 12.4,
                            direction: 'up',
                            label: '较上周',
                        }"
                    />
                    <StatCard
                        title="今日订单"
                        :value="268"
                        icon="lucide:shopping-cart"
                        :trend="{
                            value: 5.1,
                            direction: 'up',
                            label: '较昨日',
                        }"
                    />
                    <StatCard
                        title="退出率"
                        :value="3.2"
                        icon="lucide:log-out"
                        :trend="{
                            value: 1.8,
                            direction: 'down',
                            label: '较上周',
                            inverse: true,
                        }"
                    />
                    <StatCard
                        title="总收入"
                        value="¥ 8,820"
                        icon="lucide:wallet"
                        :trend="{ value: 0, direction: 'flat', label: '持平' }"
                    />
                </div>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">UserCard 用户卡片</h2>
                <div class="grid gap-4 sm:grid-cols-2">
                    <UserCard
                        :user="{
                            name: '庄周',
                            username: 'zhuang',
                            email: 'z@example.com',
                            role: [
                                '管理员',
                                { label: 'VIP', tone: 'default' as const },
                            ],
                        }"
                    >
                        <template #actions>
                            <Button variant="outline" size="sm">查看</Button>
                        </template>
                    </UserCard>
                    <UserCard
                        :user="{
                            name: '李四',
                            username: 'lisi',
                            email: 'li@example.com',
                            role: '开发者',
                        }"
                    />
                    <UserCard
                        :user="{
                            name: '王五',
                            username: 'wangwu',
                            email: 'wang@example.com',
                            role: '访客',
                        }"
                        size="sm"
                    />
                    <UserCard
                        :user="{
                            name: '赵六',
                            username: 'zhaoliu',
                            email: 'zhao@example.com',
                            role: ['运营', '编辑'],
                        }"
                        size="lg"
                    />
                </div>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">DataTable 框架表格</h2>
                <DataPanel>
                    <DataTable :columns="coreTableColumns" :data="tableRows" caption="框架通用组件列表">
                        <template #cell-name="{ value }">
                            <span class="font-medium">{{ value }}</span>
                        </template>
                    </DataTable>
                </DataPanel>
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
                <div
                    v-if="showResult"
                    class="rounded-lg border bg-card overflow-hidden"
                >
                    <ResultPage
                        status="404"
                        primary-text="重新搜索"
                        @primary="showResult = false"
                    />
                </div>
            </section>
        </div>
    </PageContainer>
</template>
