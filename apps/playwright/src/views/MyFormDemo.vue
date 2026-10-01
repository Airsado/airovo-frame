<script setup lang="ts">
/**
 * MyFormDemo — framework form integration playground.
 *
 * This page intentionally exercises the controller boundary instead of
 * hard-coding a second business form implementation:
 * - the main AForm owns the submitted values;
 * - a custom schema field opens a framework ModalApi;
 * - the modal renders another AForm for dense/optional settings;
 * - confirm patches the parent field, while cancel/close leaves it untouched;
 * - dependencies demonstrate fields that appear only when a switch is enabled.
 */
import { computed, defineComponent, h, ref, type PropType } from 'vue'
import { useForm, type FormFieldSchema } from '@airovo/forms'
import { SectionPage } from '@airovo/components'
import { useModal } from '@airovo/composables'
import {
    Badge,
    Button,
} from '@airovo/uikit-shadcnui'
import { Icon } from '@airovo/shared/icons'

defineOptions({ name: 'MyFormDemo' })

type AdvancedConfig = {
    model: string
    temperature: string
    timeout: string
    fallback: string
    fallbackModel?: string
}

type ActionState = 'idle' | 'confirmed' | 'cancelled' | 'dismissed' | 'invalid'

function getRowValue(value: unknown): unknown {
    if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined)?.value
    return value
}

function getConfigFromParent(values: Record<string, unknown>): AdvancedConfig {
    const value = getRowValue(values.advancedConfig)
    return {
        model: typeof (value as AdvancedConfig | undefined)?.model === 'string'
            ? (value as AdvancedConfig).model
            : 'gpt-4o-mini',
        temperature: String((value as AdvancedConfig | undefined)?.temperature ?? '0.2'),
        timeout: String((value as AdvancedConfig | undefined)?.timeout ?? '30'),
        fallback: typeof (value as AdvancedConfig | undefined)?.fallback === 'string'
            ? (value as AdvancedConfig).fallback
            : 'disabled',
        fallbackModel: typeof (value as AdvancedConfig | undefined)?.fallbackModel === 'string'
            ? (value as AdvancedConfig).fallbackModel
            : 'claude-3-5-sonnet',
    }
}

function normalizeConfig(values: Record<string, unknown>): AdvancedConfig {
    const read = (name: keyof AdvancedConfig): unknown => getRowValue(values[name])
    return {
        model: String(read('model') ?? ''),
        temperature: String(read('temperature') ?? '0.2'),
        timeout: String(read('timeout') ?? '30'),
        fallback: String(read('fallback') ?? 'disabled'),
        fallbackModel: String(read('fallbackModel') ?? ''),
    }
}

const dependencyStatus = ref('等待修改“发送通知”')

/**
 * A schema component can expose actions in addition to modelValue.  This is
 * the app-side composition point for a dense field; it does not modify the
 * framework form renderer or the shadcn primitives.
 */
const AdvancedConfigTrigger = defineComponent({
    name: 'AdvancedConfigTrigger',
    props: {
        modelValue: {
            type: Object as PropType<Partial<AdvancedConfig>>,
            default: () => ({}),
        },
        onOpen: Function as PropType<() => void>,
    },
    setup(props) {
        const summary = computed(() => {
            const model = props.modelValue?.model || '未配置'
            const temperature = props.modelValue?.temperature ?? '—'
            return `${model} · 温度 ${temperature}`
        })
        return () => h('div', { class: 'flex min-w-0 flex-wrap items-center gap-2' }, [
            h(Button, {
                type: 'button',
                variant: 'outline',
                size: 'sm',
                class: 'shrink-0',
                onClick: () => props.onOpen?.(),
            }, {
                default: () => [
                    h(Icon, { icon: 'lucide:sliders-horizontal', class: 'size-4' }),
                    '配置高级参数',
                ],
            }),
            h('span', { class: 'truncate text-xs text-muted-foreground' }, summary.value),
        ])
    },
})

const schema: FormFieldSchema[] = [
    {
        component: 'Input',
        label: '用户名称',
        fieldName: 'username',
        rules: 'required,min:3',
    },
    {
        component: 'Input',
        label: '用户密码',
        fieldName: 'password',
        rules: 'required,min:6',
    },
    {
        component: 'Select',
        label: '用户角色',
        fieldName: 'role',
        defaultValue: 'operator',
        componentProps: {
            options: [
                { label: '管理员', value: 'admin' },
                { label: '运营人员', value: 'operator' },
                { label: '只读访客', value: 'viewer' },
            ],
            allowClear: true,
        },
        rules: 'required',
    },
    {
        component: 'Select',
        label: '发送通知',
        fieldName: 'notify',
        defaultValue: 'disabled',
        componentProps: {
            options: [
                { label: '关闭通知', value: 'disabled' },
                { label: '启用通知', value: 'enabled' },
            ],
        },
        dependencies: {
            triggerFields: ['notify'],
            onChange: (value) => {
                dependencyStatus.value = value === 'enabled'
                    ? '已开启通知，邮箱字段已进入必填流程'
                    : '已关闭通知，邮箱字段被隐藏且不参与校验'
            },
        },
    },
    {
        component: 'Email',
        label: '通知邮箱',
        fieldName: 'notificationEmail',
        dependencies: {
            triggerFields: ['notify'],
            show: ({ values }) => getRowValue(values.notify) === 'enabled',
            if: ({ values }) => getRowValue(values.notify) === 'enabled',
            componentProps: ({ values }) => ({
                placeholder: getRowValue(values.notify) === 'enabled'
                    ? '请输入接收通知的邮箱'
                    : '通知关闭时无需填写',
            }),
        },
        rules: 'required,email',
    },
    {
        component: AdvancedConfigTrigger,
        label: '高级参数',
        fieldName: 'advancedConfig',
        defaultValue: {
            model: 'gpt-4o-mini',
            temperature: '0.2',
            timeout: '30',
            fallback: 'disabled',
            fallbackModel: 'claude-3-5-sonnet',
        } satisfies AdvancedConfig,
        description: '将复杂配置收进独立 Modal，确认后才会写回主表单。',
        componentProps: () => ({ onOpen: openAdvancedConfig }),
    },
    {
        array: true,
        ArrayField: 'value',
        component: 'Input',
        label: '用户邮箱',
        fieldName: 'emails',
        rules: 'required,email',
        maxItems: 5,
        addButtonText: '+ 添加邮箱',
        removeButtonText: '移除',
    },
    {
        component: 'Textarea',
        label: '个人简介',
        fieldName: 'bio',
        description: '这是一个可选字段，留空时不会显示必填标记。',
        componentProps: {
            rows: 4,
        },
    },
]

const advancedSchema: FormFieldSchema[] = [
    {
        component: 'Select',
        label: '默认模型',
        fieldName: 'model',
        rules: 'required',
        componentProps: {
            options: [
                { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
                { label: 'Qwen 2.5 72B', value: 'qwen2.5-72b' },
            ],
        },
    },
    {
        component: 'Number',
        label: '温度',
        fieldName: 'temperature',
        rules: 'required',
        componentProps: { min: 0, max: 2, step: 0.1 },
    },
    {
        component: 'Number',
        label: '超时时间（秒）',
        fieldName: 'timeout',
        rules: 'required',
        componentProps: { min: 1, max: 120 },
    },
    {
        component: 'Select',
        label: '失败回退',
        fieldName: 'fallback',
        defaultValue: 'disabled',
        componentProps: {
            options: [
                { label: '不启用回退', value: 'disabled' },
                { label: '启用备用模型', value: 'enabled' },
            ],
        },
    },
    {
        component: 'Select',
        label: '备用模型',
        fieldName: 'fallbackModel',
        dependencies: {
            triggerFields: ['fallback'],
            show: ({ values }) => getRowValue(values.fallback) === 'enabled',
            if: ({ values }) => getRowValue(values.fallback) === 'enabled',
        },
        componentProps: {
            options: [
                { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
                { label: 'Qwen 2.5 72B', value: 'qwen2.5-72b' },
            ],
        },
        rules: 'required',
    },
]

const toastlessStatus: Record<ActionState, { label: string; tone: 'secondary' | 'default' | 'destructive' }> = {
    idle: { label: '等待配置', tone: 'secondary' },
    confirmed: { label: '已确认回填', tone: 'default' },
    cancelled: { label: '已取消，主表单未改变', tone: 'secondary' },
    dismissed: { label: '已关闭，主表单未改变', tone: 'secondary' },
    invalid: { label: '请先修正弹窗表单', tone: 'destructive' },
}

const actionState = ref<ActionState>('idle')
const lastSubmission = ref<Record<string, unknown> | null>(null)
const [AForm, formApi] = useForm({ schema, layout: 'horizontal' })
const [AdvancedForm, advancedFormApi] = useForm({
    schema: advancedSchema,
    layout: 'vertical',
    showDefaultActions: false,
})

const [AdvancedModal, advancedModalApi] = useModal({
    title: '配置高级参数',
    description: '只在点击“确认”后回填主表单，关闭或取消不会污染当前输入。',
    confirmText: '确认并回填',
    onConfirm: async () => {
        const values = await advancedFormApi.validateAndSubmit()
        if (!values) {
            actionState.value = 'invalid'
            return false
        }
        const config = normalizeConfig(values)
        formApi.setFieldValue('advancedConfig[0].value', config)
        actionState.value = 'confirmed'
        return true
    },
    onCancel: () => {
        actionState.value = 'cancelled'
    },
    onBeforeClose: (reason) => {
        if (reason === 'escape' || reason === 'outside' || reason === 'close-button') {
            actionState.value = 'dismissed'
        }
    },
})

function openAdvancedConfig() {
    const config = getConfigFromParent(formApi.values.value)
    void advancedFormApi.setValues({
        model: [{ value: config.model }],
        temperature: [{ value: config.temperature }],
        timeout: [{ value: config.timeout }],
        fallback: [{ value: config.fallback }],
        fallbackModel: [{ value: config.fallbackModel }],
    })
    advancedFormApi.clearValid()
    actionState.value = 'idle'
    advancedModalApi.open(config)
}

async function onSubmit(values: Record<string, unknown>) {
    lastSubmission.value = values
    // eslint-disable-next-line no-console
    console.log('Submitted values:', values)
}
</script>

<template>
    <SectionPage class="min-h-full">
        <template #breadcrumb
            ><span class="text-xs text-muted-foreground"
                >开发者工具 / 表单</span
            ></template
        >
        <template #title>表单系统演示</template>
        <template #description>
            使用统一的 FormApi 渲染 schema，并演示依赖字段、Modal 子表单与状态回传。
        </template>
        <div class="mx-auto max-w-3xl space-y-4">
            <p class="text-sm text-muted-foreground">
                复杂字段可以拆到独立 Modal 中编辑；点击取消、关闭按钮、遮罩或 Esc 都不会写入主表单。
                “发送通知”和“失败回退”还展示了 dependencies 驱动的条件字段。
            </p>

            <section
                class="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6"
            >
                <AForm @submit="onSubmit" />
                <div class="mt-5 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
                    <span class="text-xs text-muted-foreground">高级参数状态</span>
                    <Badge :variant="toastlessStatus[actionState].tone">
                        {{ toastlessStatus[actionState].label }}
                    </Badge>
                </div>
                <div class="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    依赖字段状态：{{ dependencyStatus }}
                </div>
                <div v-if="lastSubmission" class="mt-4 border-t border-border/70 pt-4">
                    <div class="mb-2 text-sm font-medium">最近一次提交</div>
                    <pre class="overflow-auto rounded-md bg-muted p-3 text-xs leading-5">{{ JSON.stringify(lastSubmission, null, 2) }}</pre>
                </div>
            </section>
        </div>

        <AdvancedModal>
            <template #default>
                <AdvancedForm />
                <p class="mt-3 text-xs text-muted-foreground">
                    当前弹窗表单的校验错误会显示在对应字段下方；确认失败时 Modal 会保持打开。
                </p>
            </template>
        </AdvancedModal>
    </SectionPage>
</template>
