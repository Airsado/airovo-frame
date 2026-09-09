<script setup lang="ts">
/**
 * MyFormDemo — dev page that renders the hand-written @airovo/forms
 * AForm so the styles (Field / FieldGroup / FieldLabel / FieldError,
 * Tailwind classes inside FormFieldRender.vue) can be inspected in
 * the browser.
 */
import { ref } from 'vue'
import { AForm, type FormFieldSchema } from '@airovo/forms'

defineOptions({ name: 'MyFormDemo' })

const schema = ref<FormFieldSchema[]>([
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
])

async function onSubmit(values: Record<string, any>) {
    // eslint-disable-next-line no-console
    console.log('Submitted values:', values)
}
</script>

<template>
    <div class="mx-auto max-w-2xl space-y-6 p-6">
        <header>
            <h1 class="text-2xl font-bold tracking-tight">手写表单系统演示</h1>
            <p class="mt-1 text-sm text-muted-foreground">
                渲染 <code class="rounded bg-muted px-1.5 py-0.5">&lt;AForm&gt;</code>
                以便在浏览器里查看
                <code class="rounded bg-muted px-1.5 py-0.5">FormFieldRender.vue</code>
                中的手写样式（Field / FieldGroup / FieldLabel / FieldError）。
            </p>
        </header>

        <section class="rounded-lg border bg-card p-6 shadow-sm">
            <AForm :schema="schema" @submit="onSubmit" />
        </section>
    </div>
</template>
