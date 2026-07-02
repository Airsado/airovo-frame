<script lang="ts" setup>
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
} from '@airovo/uikit-vue'
import { Icon } from '@airovo/shared/icons'

defineOptions({ name: 'UserDropDown' })
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <button
                class="cursor-pointer inline-flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2 outline-none"
            >
                <Avatar class="size-7">
                    <AvatarImage src="https://www.airsado.cn/usr/uploads/avatar_24.jpg" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">Airsado</span>
                <span class="text-xs text-muted-foreground">admin@airovo.cn</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <Icon icon="lucide:user" class="mr-2 size-4" />
                <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Icon icon="lucide:settings" class="mr-2 size-4" />
                <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <Icon icon="lucide:log-out" class="mr-2 size-4" />
                <span>退出登录</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
