<script setup lang="ts">
/**
 * BasicTabBar — vben-style multi-tab strip.
 *
 * Renders the open tabs as a horizontal scrollable strip with a
 * per-tab dropdown for actions (refresh, pin, close, close-others,
 * close-all, maximize). Right-click on a tab opens the context menu
 * at the mouse position.
 *
 * Designed to be slotted into the BasicLayout's <main> above the
 * <ScrollArea>. Hidden automatically when there are no tabs.
 */
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useTabStore } from '@airovo/stores/tabs'

defineOptions({ name: 'BasicTabBar' })

const router = useRouter()
const route = useRoute()
const tabs = useTabStore()

const contextMenu = ref<{ x: number; y: number; tabId: string } | null>(null)

function isActive(id: string): boolean {
    return id === tabs.activeTabId
}

function clickTab(id: string, fullPath: string) {
    tabs.activate(id)
    if (route.fullPath !== fullPath) {
        router.push(fullPath)
    }
}

function showContext(e: MouseEvent, id: string) {
    e.preventDefault()
    contextMenu.value = { x: e.clientX, y: e.clientY, tabId: id }
}

function closeContext() {
    contextMenu.value = null
}

function middleClickClose(e: MouseEvent, tab: { id: string; closable: boolean; affix: boolean }) {
    if (e.button === 1 && tab.closable && !tab.affix) {
        e.preventDefault()
        tabs.closeTab(tab.id)
    }
}

// Sorted tabs: affix first, then pinned, then the rest in insertion order.
const sortedTabs = computed(() => {
    return [...tabs.tabs].sort((a, b) => {
        if (a.affix !== b.affix) return a.affix ? -1 : 1
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return 0
    })
})

function closeOtherFromContext() {
    if (contextMenu.value) {
        tabs.closeOthers(contextMenu.value.tabId)
        closeContext()
    }
}

function closeAllFromContext() {
    tabs.closeAll()
    closeContext()
}

function refreshFromContext() {
    if (contextMenu.value) {
        tabs.refreshTab(contextMenu.value.tabId)
        closeContext()
    }
}

function pinFromContext() {
    if (contextMenu.value) {
        tabs.pinTab(contextMenu.value.tabId)
        closeContext()
    }
}

function maximizeFromContext() {
    if (contextMenu.value) {
        tabs.maximizeTab(contextMenu.value.tabId)
        closeContext()
    }
}

function closeFromContext() {
    if (contextMenu.value) {
        tabs.closeTab(contextMenu.value.tabId)
        closeContext()
    }
}

function stopClick(e: MouseEvent) {
    e.stopPropagation()
}

onMounted(() => {
    document.addEventListener('click', closeContext)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', closeContext)
})
</script>

<template>
    <div
        v-if="sortedTabs.length > 0"
        class="border-b border-border bg-card sticky top-(--header-height) z-30 flex items-center"
        @click="closeContext"
    >
        <div class="flex-1 overflow-x-auto">
            <div class="flex items-center gap-1 px-2 py-1 whitespace-nowrap">
                <div
                    v-for="t in sortedTabs"
                    :key="t.id"
                    :class="[
                        'group relative flex items-center gap-1.5 h-8 px-3 rounded-md text-sm cursor-pointer select-none border border-transparent',
                        isActive(t.id)
                            ? 'bg-secondary text-secondary-foreground font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    ]"
                    @click="clickTab(t.id, t.fullPath)"
                    @contextmenu="showContext($event, t.id)"
                    @mousedown="middleClickClose($event, t)"
                >
                    <Icon
                        v-if="t.icon"
                        :icon="t.icon"
                        class="size-3.5 shrink-0"
                    />
                    <span class="truncate max-w-40">{{ t.title }}</span>
                    <span
                        v-if="t.pinned"
                        class="text-[10px] text-muted-foreground/70"
                    >📌</span>
                    <button
                        v-if="t.closable"
                        type="button"
                        class="ml-1 size-4 rounded-sm inline-flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-foreground/10"
                        @click.stop="tabs.closeTab(t.id)"
                    >
                        <Icon icon="lucide:x" class="size-3" />
                    </button>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-1 px-2 border-l border-border">
            <button
                type="button"
                class="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title="刷新当前"
                @click="tabs.refreshTab(tabs.activeTabId ?? '')"
            >
                <Icon icon="lucide:rotate-ccw" class="size-3.5" />
            </button>
            <button
                type="button"
                class="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title="关闭其他"
                @click="tabs.closeOthers(tabs.activeTabId ?? '')"
            >
                <Icon icon="lucide:x-circle" class="size-3.5" />
            </button>
            <button
                type="button"
                class="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title="最大化"
                @click="tabs.maximizeTab(tabs.activeTabId)"
            >
                <Icon icon="lucide:maximize-2" class="size-3.5" />
            </button>
        </div>

        <!-- Right-click context menu (positioned at mouse coords). -->
        <Teleport to="body">
            <div
                v-if="contextMenu"
                class="fixed z-50 min-w-40 rounded-md border bg-card p-1 shadow-md"
                :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
                @click="stopClick"
            >
                <button
                    type="button"
                    class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/60 inline-flex items-center gap-2"
                    @click="refreshFromContext"
                >
                    <Icon icon="lucide:rotate-ccw" class="size-3.5" />刷新
                </button>
                <button
                    type="button"
                    class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/60 inline-flex items-center gap-2"
                    @click="pinFromContext"
                >
                    <Icon icon="lucide:pin" class="size-3.5" />钉住
                </button>
                <button
                    type="button"
                    class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/60 inline-flex items-center gap-2"
                    @click="maximizeFromContext"
                >
                    <Icon icon="lucide:maximize-2" class="size-3.5" />最大化
                </button>
                <div class="my-1 h-px bg-border" />
                <button
                    type="button"
                    class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/60 inline-flex items-center gap-2"
                    @click="closeFromContext"
                >
                    <Icon icon="lucide:x" class="size-3.5" />关闭
                </button>
                <button
                    type="button"
                    class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/60 inline-flex items-center gap-2"
                    @click="closeOtherFromContext"
                >
                    关闭其他
                </button>
                <button
                    type="button"
                    class="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/60 inline-flex items-center gap-2"
                    @click="closeAllFromContext"
                >
                    关闭全部
                </button>
            </div>
        </Teleport>
    </div>
</template>
