<script lang="ts" setup>
import { useAForm, AForm, createLoginSchema } from '@airovo/forms'
import { Button } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'AFormDemo' })

/**
 * Example showing how to use AForm's JSON-Schema-driven approach:
 * - Define fields declaratively
 * - Use any vee-validate-compatible validator (zod here)
 * - Bind reactivity to <AForm> via v-model:values + :errors
 */
const {
    handleSubmit,
    values,
    errors,
    isSubmitting,
    reset,
} = useAForm(createLoginSchema())

const onSubmit = handleSubmit(async (data) => {
    // Fully typed! data: { username: string, password: string }
    await new Promise((r) => setTimeout(r, 500))
    alert(`登录提交：${data.username}`)
})
</script>

<template>
    <div class="mx-auto max-w-md space-y-6 p-6">
        <div>
            <h1 class="text-2xl font-bold">AForm JSON-Schema 演示</h1>
            <p class="text-sm text-muted-foreground">
                基于 vee-validate + zod，字段由 schema 自动渲染。
            </p>
        </div>

        <AForm
            :schema="createLoginSchema()"
            v-model:values="values"
            :errors="errors"
            @submit="onSubmit"
        >
            <template #actions>
                <Button type="submit" class="w-full" :class="{ 'opacity-50': isSubmitting }">
                    {{ isSubmitting ? '登录中...' : '登录' }}
                </Button>
            </template>
        </AForm>

        <Button variant="outline" class="w-full" @click="reset()">
            重置表单
        </Button>

        <!-- Debug -->
        <div class="rounded-md border bg-muted/30 p-3 text-xs space-y-1 font-mono">
            <div class="text-muted-foreground">实时值（调试）：</div>
            <div>values: {{ JSON.stringify(values) }}</div>
            <div>errors: {{ JSON.stringify(errors) }}</div>
        </div>
    </div>
</template>
