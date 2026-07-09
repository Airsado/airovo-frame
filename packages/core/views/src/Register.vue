<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
    Button,
    Input,
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
} from '@airovo/uikit-shadcnui'
import { Icon } from '@iconify/vue'

defineOptions({ name: 'FrameworkRegister' })

/**
 * Injection props — apps pass auth functions / errors.
 * Avoids views depending on stores directly (breaks circular deps).
 */
interface RegisterError {
    code?: 'email_taken' | 'invalid' | 'network' | 'validation'
    message: string
}
interface FrameworkAuth {
    register: (params: {
        username: string
        email: string
        password: string
        confirmPassword: string
    }) => Promise<RegisterError | null>
}

const props = withDefaults(defineProps<{
    auth?: FrameworkAuth
}>(), { auth: undefined })

import { computed } from 'vue'
const auth = computed(() => props.auth)

const router = useRouter()

const form = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
})
const error = ref('')
const isLoading = ref(false)

async function handleSubmit() {
    if (!form.value.username) {
        error.value = '请输入用户名'
        return
    }
    if (!form.value.email) {
        error.value = '请输入邮箱'
        return
    }
    if (form.value.password.length < 6) {
        error.value = '密码至少 6 位'
        return
    }
    if (form.value.password !== form.value.confirmPassword) {
        error.value = '两次密码输入不一致'
        return
    }

    error.value = ''
    isLoading.value = true
    try {
        const result = await auth.value?.register({
            username: form.value.username,
            email: form.value.email,
            password: form.value.password,
            confirmPassword: form.value.confirmPassword,
        })
        if (result) {
            error.value = result.message
        } else {
            router.push('/login')
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex">
        <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-primary/60 relative overflow-hidden">
            <div class="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
            <div class="relative z-10 flex flex-col justify-center items-center w-full text-white p-12">
                <div class="max-w-md text-center space-y-6">
                    <h1 class="text-4xl font-bold">加入我们</h1>
                    <p class="text-lg opacity-90">创建账号，开始使用管理框架</p>
                    <div class="mt-12 space-y-4 text-sm opacity-80">
                        <div class="flex items-center justify-center gap-2">
                            <Icon icon="lucide:check" class="size-5" />
                            <span>零配置上线</span>
                        </div>
                        <div class="flex items-center justify-center gap-2">
                            <Icon icon="lucide:check" class="size-5" />
                            <span>完整 TypeScript 类型</span>
                        </div>
                        <div class="flex items-center justify-center gap-2">
                            <Icon icon="lucide:check" class="size-5" />
                            <span>可插拔架构</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 flex items-center justify-center p-8 bg-background">
            <form class="w-full max-w-md space-y-6" @submit.prevent="handleSubmit">
                <div class="lg:hidden text-center">
                    <h1 class="text-2xl font-bold">airovo-frame</h1>
                </div>

                <div class="space-y-2 text-center lg:text-left">
                    <h2 class="text-2xl font-bold tracking-tight">注册</h2>
                    <p class="text-sm text-muted-foreground">填写以下信息创建账号</p>
                </div>

                <div class="space-y-4">
                    <Field>
                        <FieldLabel for="username">用户名</FieldLabel>
                        <Input
                            id="username"
                            v-model="form.username"
                            type="text"
                            placeholder="请输入用户名"
                            autocomplete="username"
                        />
                    </Field>

                    <Field>
                        <FieldLabel for="email">邮箱</FieldLabel>
                        <Input
                            id="email"
                            v-model="form.email"
                            type="email"
                            placeholder="请输入邮箱"
                            autocomplete="email"
                        />
                    </Field>

                    <Field>
                        <FieldLabel for="password">密码</FieldLabel>
                        <Input
                            id="password"
                            v-model="form.password"
                            type="password"
                            placeholder="请输入密码（至少 6 位）"
                            autocomplete="new-password"
                        />
                        <FieldDescription>密码至少需要 6 位字符</FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel for="confirmPassword">确认密码</FieldLabel>
                        <Input
                            id="confirmPassword"
                            v-model="form.confirmPassword"
                            type="password"
                            placeholder="请再次输入密码"
                            autocomplete="new-password"
                        />
                        <FieldDescription>两次密码必须一致</FieldDescription>
                    </Field>

                    <FieldError v-if="error" :errors="[error]" />

                    <Button
                        type="submit"
                        class="w-full h-10"
                        :class="{ 'opacity-50': isLoading }"
                    >
                        <Icon
                            v-if="isLoading"
                            icon="lucide:loader-2"
                            class="mr-2 size-4 animate-spin"
                        />
                        {{ isLoading ? '注册中...' : '注册' }}
                    </Button>
                </div>

                <div class="text-center text-sm">
                    <span class="text-muted-foreground">已有账号？</span>
                    <router-link to="/login" class="text-primary hover:underline ml-1">
                        立即登录
                    </router-link>
                </div>
            </form>
        </div>
    </div>
</template>
