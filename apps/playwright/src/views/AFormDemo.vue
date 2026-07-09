<script lang="ts" setup>
import { useAForm, AForm, createLoginSchema, createRegisterSchema } from '@airovo/forms'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@airovo/uikit-shadcnui'
import { computed } from 'vue'

defineOptions({ name: 'AFormDemo' })

// ── Login form ──

const loginSchema = createLoginSchema()

const {
    api: loginApi,
    values: loginValues,
    errors: loginErrors,
    isSubmitting: loginSubmitting,
    handleSubmit: loginSubmit,
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
    isSubmitting: registerSubmitting,
    handleSubmit: registerSubmit,
} = useAForm({
    ...registerSchema,
    wrapperClass: 'grid-cols-1',
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
    <div class="mx-auto max-w-2xl space-y-6 p-6">
        <div>
            <h1 class="text-2xl font-bold">AForm 表单系统演示</h1>
            <p class="text-sm text-muted-foreground">
                FormApi + componentMap + 依赖联动 + 网格布局 + 折叠
            </p>
        </div>

        <Tabs default-value="login">
            <TabsList>
                <TabsTrigger value="login">登录表单</TabsTrigger>
                <TabsTrigger value="register">注册表单</TabsTrigger>
                <TabsTrigger value="grid">网格布局</TabsTrigger>
            </TabsList>

            <!-- Login -->
            <TabsContent value="login" class="mt-4">
                <AForm
                    :api="loginApi"
                    wrapper-class="grid-cols-1"
                    submit-button-text="登录"
                />

                <div class="mt-4 rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                    <div class="text-muted-foreground">调试信息：</div>
                    <div>values: {{ JSON.stringify(loginValues) }}</div>
                    <div>errors: {{ JSON.stringify(loginErrors) }}</div>
                </div>
            </TabsContent>

            <!-- Register -->
            <TabsContent value="register" class="mt-4">
                <AForm
                    :api="registerApi"
                    wrapper-class="grid-cols-1"
                    submit-button-text="注册"
                />

                <div class="mt-4 rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                    <div class="text-muted-foreground">调试信息：</div>
                    <div>values: {{ JSON.stringify(registerValues) }}</div>
                    <div>errors: {{ JSON.stringify(registerErrors) }}</div>
                </div>
            </TabsContent>

            <!-- Grid layout -->
            <TabsContent value="grid" class="mt-4">
                <AForm
                    :api="gridForm.api"
                    wrapper-class="grid-cols-2"
                    submit-button-text="保存"
                />

                <div class="mt-4 rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                    <div class="text-muted-foreground">values:</div>
                    <div>{{ JSON.stringify(gridForm.values) }}</div>
                </div>
            </TabsContent>
        </Tabs>
    </div>
</template>
