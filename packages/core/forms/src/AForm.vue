<script setup lang="ts">
/**
 * AForm — 表单容器。
 *
 * 使用 useAForm 创建 FormApi + vee-validate 表单上下文（自动 provide
 * 给子组件 FormFieldRender）。AForm 提供默认的 <form> 包装、提交
 * 按钮和 actions slot。FormFieldRender 通过 inject 拿 form context。
 */
import { ref } from 'vue'
import FormFieldRender from './FormFieldRender.vue'
import { useAForm } from './useAForm'
import type { FormFieldSchema } from './types'

const props = defineProps<{
    schema: FormFieldSchema[]
    initialValues?: Record<string, any>
}>()

const emit = defineEmits<{
    submit: [values: Record<string, any>]
    'submit-fail': [errors: Record<string, string>]
}>()

const { api, values, errors, submitForm } = useAForm({
    schema: props.schema,
    initialValues: props.initialValues,
})

const submitting = ref(false)

async function onSubmit() {
    submitting.value = true
    try {
        const result = await submitForm()
        if (result) {
            emit('submit', result)
        } else {
            emit('submit-fail', errors.value)
        }
    } finally {
        submitting.value = false
    }
}

function onReset() {
    api.resetForm()
}
</script>

<template>
    <form @submit.prevent="onSubmit" class="space-y-4">
        <FormFieldRender :schema="props.schema" />

        <slot
            name="actions"
            :values="values"
            :errors="errors"
            :submitting="submitting"
            :reset="onReset"
        >
            <!-- 默认 actions 行（消费者可通过 slot="actions" 覆盖） -->
            <div class="flex justify-end gap-2">
                <button
                    type="button"
                    class="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                    @click="onReset"
                >重置</button>
                <button
                    type="submit"
                    class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    :disabled="submitting"
                >{{ submitting ? '提交中...' : '提交' }}</button>
            </div>
        </slot>
    </form>
</template>
