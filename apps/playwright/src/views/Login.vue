<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    Button,
    Input,
    Field,
    FieldLabel,
    FieldError,
    FieldDescription,
} from '@airovo/uikit-shadcnui'
import { Icon } from '@airovo/shared/icons'
import { useAuthStore } from '@airovo/stores/auth'

defineOptions({ name: 'Login' })

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
    username: '',
    password: '',
})
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
    if (!form.value.username || !form.value.password) {
        error.value = '请输入用户名和密码'
        return
    }

    error.value = ''
    isLoading.value = true

    try {
        const success = await authStore.login(form.value)

        if (success) {
            const redirect = (route.query.redirect as string) || '/dashboard'
            router.push(redirect)
        } else {
            error.value = '用户名或密码错误'
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex">
        <!-- 左侧背景区域 -->
        <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-primary/60 relative overflow-hidden">
            <div class="relative z-10 flex flex-col justify-center items-center w-full text-white p-12">
                <div class="max-w-md text-center space-y-6">
                    <h1 class="text-4xl font-bold">airovo-frame</h1>
                    <p class="text-lg opacity-90">基于 Vue 3 + Vite + Tailwind 4 的现代管理框架</p>
                </div>
            </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="flex-1 flex items-center justify-center p-8 bg-background">
            <form @submit.prevent="handleLogin" class="w-full max-w-md space-y-6">
                <div class="lg:hidden text-center">
                    <h1 class="text-2xl font-bold">airovo-frame</h1>
                </div>

                <div class="space-y-2 text-center lg:text-left">
                    <h2 class="text-2xl font-bold tracking-tight">登录</h2>
                    <p class="text-sm text-muted-foreground">欢迎回来，请登录您的账号</p>
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
                        <FieldLabel for="password">密码</FieldLabel>
                        <Input
                            id="password"
                            v-model="form.password"
                            type="password"
                            placeholder="请输入密码"
                            autocomplete="current-password"
                        />
                        <FieldDescription>
                            忘记了密码？<a href="#" class="text-primary hover:underline">找回密码</a>
                        </FieldDescription>
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
                        {{ isLoading ? '登录中...' : '登录' }}
                    </Button>
                </div>

                <div class="text-center text-sm">
                    <span class="text-muted-foreground">还没有账号？</span>
                    <router-link to="/register" class="text-primary hover:underline ml-1">
                        立即注册
                    </router-link>
                </div>
            </form>
        </div>
    </div>
</template>
