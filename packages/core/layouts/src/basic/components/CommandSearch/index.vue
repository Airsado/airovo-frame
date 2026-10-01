<script lang="ts" setup>
import {
    Button,
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    Dialog,
    DialogContent,
    DialogTitle,
} from '@airovo/uikit-shadcnui'
import { Icon } from '@airovo/shared/icons'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SidebarMenuItemType } from '../../sidebar/types'

defineOptions({ name: 'CommandSearch' })

const props = defineProps<{
    menus?: SidebarMenuItemType[]
}>()

const open = ref(false)
const router = useRouter()
const { t, te } = useI18n({ useScope: 'global' })

function menuLabel(item: SidebarMenuItemType): string {
    return item.titleKey && te(item.titleKey) ? t(item.titleKey) : item.title
}


function onSelect(url: string): void {
    router.push(url)
    open.value = false
}
</script>

<template>
    <Button
        data-slot="header-search"
        type="button"
        variant="outline"
        aria-label="搜索菜单"
        title="搜索菜单"
        class="group relative h-8 w-8 shrink-0 justify-start rounded-md bg-muted/25 px-2.5 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent hover:text-foreground sm:w-40 sm:pe-12 md:w-52 lg:w-56 xl:w-64"
        @click="open = true">
        <Icon icon="lucide:search" class="size-4 shrink-0 sm:absolute sm:start-1.5 sm:top-1/2 sm:-translate-y-1/2" />
        <span class="ms-2 hidden truncate sm:inline">搜索...</span>
        <kbd class="pointer-events-none absolute end-1 top-1 hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium select-none sm:flex group-hover:bg-accent">
            <span class="text-xs">⌘</span>K
        </kbd>
    </Button>

    <Dialog :open="open" @update:open="(v) => (open = v)">
        <DialogContent>
            <DialogTitle class="sr-only">菜单搜索</DialogTitle>
            <Command>
                <CommandInput />
                <CommandList>
                    <CommandEmpty>没有找到结果。</CommandEmpty>
                    <CommandGroup :heading="menuLabel(item)" class="p-1" v-for="item in props.menus" :key="item.url">
                        <CommandItem v-for="subItem in item.children" :key="subItem.url" :value="menuLabel(subItem)"
                            class="cursor-pointer" @select="onSelect(subItem.url)">
                            <Icon :icon="subItem.icon || 'lucide:link'" class="mr-2 size-4" />
                            <span>{{ menuLabel(subItem) }}</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </DialogContent>
    </Dialog>
</template>
