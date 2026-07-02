<script lang="ts" setup>
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    Dialog,
    DialogContent,
    DialogTitle,
} from '@airovo/uikit-vue'
import { Icon } from '@airovo/shared/icons'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { SidebarMenuItemType } from '../../sidebar/types'

defineOptions({ name: 'CommandSearch' })

const props = defineProps<{
    menus?: SidebarMenuItemType[]
}>()

const open = ref(false)
const router = useRouter()

type FlatItem = { title: string; url: string; icon?: string; group: string }

function flatten(items: SidebarMenuItemType[], parent = ''): FlatItem[] {
    const out: FlatItem[] = []
    for (const item of items) {
        out.push({ title: item.title, url: item.url, icon: item.icon, group: parent || item.title })
        if (item.children?.length) {
            out.push(...flatten(item.children, item.title))
        }
    }
    return out
}

function onSelect(url: string): void {
    router.push(url)
    open.value = false
}
</script>

<template>
    <button
        class="group/button inline-flex items-center border bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 bg-muted/25 group text-muted-foreground hover:bg-accent relative h-8 w-full flex-1 justify-start rounded-md text-sm font-normal shadow-none sm:w-40 sm:pe-12 md:flex-none lg:w-52 xl:w-64 cursor-pointer"
        @click="open = true"
    >
        <Icon icon="lucide:search" class="size-4" />
        <span class="hidden sm:inline">搜索...</span>
    </button>

    <Dialog :open="open" @update:open="(v) => (open = v)">
        <DialogContent>
            <DialogTitle class="sr-only">菜单搜索</DialogTitle>
            <Command>
                <CommandInput />
                <CommandList>
                    <CommandEmpty>没有找到结果。</CommandEmpty>
                    <CommandGroup heading="菜单">
                        <CommandItem
                            v-for="item in flatten(props.menus ?? [])"
                            :key="item.url"
                            :value="item.title"
                            @select="onSelect(item.url)"
                        >
                            <Icon :icon="item.icon || 'lucide:link'" class="mr-2 size-4" />
                            <span>{{ item.title }}</span>
                            <span class="ml-auto text-xs text-muted-foreground">{{ item.group }}</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </DialogContent>
    </Dialog>
</template>
