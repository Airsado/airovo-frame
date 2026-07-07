<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@airovo/uikit-shadcnui'
import { Icon } from '@airovo/shared/icons'
import { useAuthStore } from '@airovo/stores/auth'

defineOptions({ name: 'UserDropDown' })

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isLoggedIn = computed(() => authStore.isLoggedIn)
const userAvatar = computed(() => user.value?.avatar || '')
const userInitial = computed(() => user.value?.username?.[0]?.toUpperCase() || 'U')
const userName = computed(() => user.value?.nickname || user.value?.username || '用户')
const userEmail = computed(() => user.value?.email || '未登录')

function goToProfile() {
    router.push('/profile')
}

function handleLogout() {
    authStore.logout()
    router.push('/login')
}

function goToLogin() {
    router.push('/login')
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <button
                class="cursor-pointer inline-flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2 outline-none"
            >
                <Avatar class="size-7">
                    <AvatarImage :src="userAvatar" />
                    <AvatarFallback>{{ userInitial }}</AvatarFallback>
                </Avatar>
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">{{ userName }}</span>
                <span class="text-xs text-muted-foreground">{{ userEmail }}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <template v-if="isLoggedIn">
                <DropdownMenuItem>
                    <Icon icon="lucide:user" class="mr-2 size-4" />
                    <span @click="goToProfile">个人资料</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Icon icon="lucide:settings" class="mr-2 size-4" />
                    <span>设置</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Icon icon="lucide:log-out" class="mr-2 size-4" />
                    <span @click="handleLogout">退出登录</span>
                </DropdownMenuItem>
            </template>
            <template v-else>
                <DropdownMenuItem>
                    <Icon icon="lucide:log-in" class="mr-2 size-4" />
                    <span @click="goToLogin">登录</span>
                </DropdownMenuItem>
            </template>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
