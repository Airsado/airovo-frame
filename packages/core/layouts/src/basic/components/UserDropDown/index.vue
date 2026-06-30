<script lang="ts" setup>
import {
    AvatarImage,
    AvatarFallback,
    Avatar,
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from '@airovo/uikit-vue';

</script>

<template>
    <HoverCard>
        <HoverCardTrigger as-child
            class="rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2">
            <div class="select-none cursor-pointer inline-flex items-center gap-2">
                <Avatar>
                    <AvatarImage src="https://www.airsado.cn/usr/uploads/avatar_24.jpg" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <!-- <span class="text-sm text-foreground">Airsado</span> -->
            </div>
        </HoverCardTrigger>
        <HoverCardContent class="mr-8">
            1
        </HoverCardContent>
    </HoverCard>
</template>