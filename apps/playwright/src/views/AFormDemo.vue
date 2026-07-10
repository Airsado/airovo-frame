<script lang="ts" setup>
import { useAForm, AForm, createLoginSchema, createRegisterSchema } from '@airovo/forms'

defineOptions({ name: 'AFormDemo' })

// ── Login form ──

const loginSchema = createLoginSchema()

const {
    api: loginApi,
    values: loginValues,
    errors: loginErrors,
} = useAForm({
    ...loginSchema,
    handleSubmit: async (data) => {
        await new Promise((r) => setTimeout(r, 500))
        alert(`登录：${data.username}`)
    },
})

// ── Register form ──

const registerSchema = createRegisterSchema()

const {
    api: registerApi,
    values: registerValues,
    errors: registerErrors,
} = useAForm({
    ...registerSchema,
    handleSubmit: async (data) => {
        await new Promise((r) => setTimeout(r, 500))
        alert(`注册：${data.username} / ${data.email}`)
    },
})

// ── Grid demo ──

const gridForm = useAForm({
    schema: [
        { fieldName: 'firstName', label: '名', component: 'Input', componentProps: { placeholder: '名' } },
        { fieldName: 'lastName', label: '姓', component: 'Input', componentProps: { placeholder: '姓' } },
        { fieldName: 'email', label: '邮箱', component: 'Email', componentProps: { placeholder: 'email@example.com' } },
        { fieldName: 'phone', label: '电话', component: 'Number', componentProps: { placeholder: '手机号' } },
    ],
    wrapperClass: 'grid-cols-2',
    handleSubmit: async (data) => {
        alert(`网格表单：${JSON.stringify(data)}`)
    },
})
</script>

<template>
    <div class="mx-auto max-w-2xl space-y-10 p-6">
        <div>
            <h1 class="text-2xl font-bold">AForm 表单系统演示</h1>
            <p class="text-sm text-muted-foreground">FormApi + componentMap + 网格布局 + zod 校验</p>
        </div>

        <!-- Login -->
        <section>
            <h2 class="mb-4 text-lg font-semibold">登录表单</h2>
            <AForm :api="loginApi" submit-button-text="登录" />
            <div class="mt-4 rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                <div class="text-muted-foreground">values: {{ JSON.stringify(loginValues) }}</div>
                <div class="text-muted-foreground">errors: {{ JSON.stringify(loginErrors) }}</div>
            </div>
        </section>

        <!-- Register -->
        <section>
            <h2 class="mb-4 text-lg font-semibold">注册表单</h2>
            <AForm :api="registerApi" submit-button-text="注册" />
            <div class="mt-4 rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                <div class="text-muted-foreground">values: {{ JSON.stringify(registerValues) }}</div>
                <div class="text-muted-foreground">errors: {{ JSON.stringify(registerErrors) }}</div>
            </div>
        </section>

        <!-- Grid -->
        <section>
            <h2 class="mb-4 text-lg font-semibold">网格布局（两列）</h2>
            <AForm :api="gridForm.api" wrapper-class="grid-cols-2" submit-button-text="保存" />
            <div class="mt-4 rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                <div class="text-muted-foreground">values: {{ JSON.stringify(gridForm.values) }}</div>
            </div>
        </section>
    </div>
</template>
