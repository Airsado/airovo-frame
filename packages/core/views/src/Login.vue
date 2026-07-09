<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@airovo/uikit-shadcnui'
import { Icon } from '@iconify/vue'

defineOptions({ name: 'FrameworkLogin' })

const router = useRouter()
const route = useRoute()

function goToRegister() {
    router.push('/register')
}

function handleSubmit(_event: Event) {
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-background p-4">
        <div class="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 text-card-foreground">
            <div class="space-y-2 text-center">
                <h1 class="text-2xl font-bold tracking-tight">登录</h1>
                <p class="text-sm text-muted-foreground">框架默认登录页 - 业务应用可自定义</p>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
                <slot name="form" />
                <Button type="submit" class="w-full">
                    <Icon icon="lucide:log-in" class="mr-2 size-4" />
                    登录
                </Button>
            </form>

            <div class="text-center text-sm">
                <span class="text-muted-foreground">还没有账号？</span>
                <a href="#" class="text-primary hover:underline ml-1" @click.prevent="goToRegister">立即注册</a>
            </div>
        </div>
    </div>
</template>
