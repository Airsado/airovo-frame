<script lang="ts" setup>
import {
    SidebarInset,
    SidebarProvider,
} from '@airovo/uikit-vue';

import { BasicHeader, BasicSidebar } from './index';
import { ref } from 'vue';



defineOptions({ name: 'BasicLayout' });


const data = ref({
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "仪表盘",
            url: "#",
            icon: "lucide:activity",
            items: [
                {
                    title: "History",
                    url: "#",
                    icon: "lucide:clock",
                },
                {
                    title: "Starred",
                    url: "#",
                    icon: "lucide:star",
                },
                {
                    title: "Settings",
                    url: "#",
                    icon: "lucide:settings",
                },
            ],
        },
        {
            title: "模块",
            url: "#",
            icon: "lucide:mountain",
            items: [
                {
                    title: "Genesis",
                    url: "#",
                    icon: "lucide:box",
                },
                {
                    title: "Explorer",
                    url: "#",
                    icon: "lucide:compass",
                },
                {
                    title: "Quantum",
                    url: "#",
                    icon: "lucide:cpu",
                },
            ],
        }
    ]
})

</script>

<template>
    <div class="[--header-height:calc(--spacing(14))]">
        <SidebarProvider class="flex flex-col">
            <BasicHeader />
            <div class="flex flex-1 overflow-hidden">
                <BasicSidebar :menus="data.navMain" collapsible="icon" />
                <SidebarInset class="rounded-tl-lg bg-background overflow-auto">
                    <div class="flex flex-1 flex-col gap-4 p-4">
                        <div class="grid auto-rows-min gap-4 md:grid-cols-3">
                            <div class="bg-muted/50 aspect-video rounded-xl" />
                            <div class="bg-muted/50 aspect-video rounded-xl" />
                            <div class="bg-muted/50 aspect-video rounded-xl" />
                        </div>
                        <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    </div>
</template>