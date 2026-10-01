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
 * native content viewport. Hidden automatically when there are no tabs.
 */
import { computed, getCurrentInstance, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useTabStore } from '@airovo/stores/tabs'

defineOptions({ name: 'BasicTabBar' })

const router = useRouter()
const route = useRoute()
const tabs = useTabStore()
const appGlobals = getCurrentInstance()?.appContext.config.globalProperties

const contextMenu = ref<{ x: number; y: number; tabId: string } | null>(null)
const tabScroll = ref<HTMLElement | null>(null)
const tabElements = new Map<string, HTMLElement>()
const canScrollRight = ref(false)

function isActive(id: string): boolean {
    return id === tabs.activeTabId
}

function tabTitle(tab: { title: string; titleKey?: string }): string {
    const translate = appGlobals?.$t as ((key: string) => string) | undefined
    const exists = appGlobals?.$te as ((key: string) => boolean) | undefined
    if (tab.titleKey && translate && exists?.(tab.titleKey)) return translate(tab.titleKey)
    return tab.title
}

function clickTab(id: string, fullPath: string) {
    tabs.activate(id)
    nextTick(() => revealTab(id))
    if (route.fullPath !== fullPath) {
        router.push(fullPath)
    }
}

function setTabElement(id: string, element: unknown): void {
    if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) tabElements.set(id, element)
    else tabElements.delete(id)
}

function updateScrollState(): void {
    const element = tabScroll.value
    if (!element) {
        canScrollRight.value = false
        return
    }
    canScrollRight.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 4
}

function revealTab(id: string): void {
    const host = tabScroll.value
    const tab = tabElements.get(id)
    if (!host || !tab) return

    const hostRect = host.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()
    const edgePadding = 24
    const isNearLeftEdge = tabRect.left < hostRect.left + edgePadding
    const isNearRightEdge = tabRect.right > hostRect.right - edgePadding
    if (!isNearLeftEdge && !isNearRightEdge) {
        updateScrollState()
        return
    }

    const maxScrollLeft = Math.max(0, host.scrollWidth - host.clientWidth)
    const centeredLeft = tab.offsetLeft - (host.clientWidth - tab.offsetWidth) / 2
    host.scrollTo({
        left: Math.max(0, Math.min(centeredLeft, maxScrollLeft)),
        behavior: 'smooth',
    })
    window.setTimeout(updateScrollState, 220)
}

function scrollTabsRight(): void {
    const element = tabScroll.value
    if (!element) return
    element.scrollBy({ left: Math.max(180, element.clientWidth * 0.7), behavior: 'smooth' })
    window.setTimeout(updateScrollState, 220)
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
        closeTabAndNavigate(tab.id)
    }
}

function navigateToActiveTab() {
    const active = tabs.tabs.find((tab) => tab.id === tabs.activeTabId)
    if (active && route.fullPath !== active.fullPath) void router.push(active.fullPath)
}

function closeTabAndNavigate(id: string) {
    tabs.closeTab(id)
    navigateToActiveTab()
}

function closeOthersAndNavigate(id: string) {
    tabs.closeOthers(id)
    tabs.activate(id)
    navigateToActiveTab()
}

function closeAllAndNavigate() {
    tabs.closeAll()
    if (tabs.activeTabId) navigateToActiveTab()
    else void router.push('/')
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
        closeOthersAndNavigate(contextMenu.value.tabId)
        closeContext()
    }
}

function closeAllFromContext() {
    closeAllAndNavigate()
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
        const tabId = contextMenu.value.tabId
        tabs.maximizeTab(tabs.maximizedTabId === tabId ? null : tabId)
        closeContext()
    }
}

function closeFromContext() {
    if (contextMenu.value) {
        closeTabAndNavigate(contextMenu.value.tabId)
        closeContext()
    }
}

function stopClick(e: MouseEvent) {
    e.stopPropagation()
}

onMounted(() => {
    document.addEventListener('click', closeContext)
    window.addEventListener('resize', updateScrollState)
    nextTick(() => {
        updateScrollState()
        if (tabs.activeTabId) revealTab(tabs.activeTabId)
    })
})
onBeforeUnmount(() => {
    document.removeEventListener('click', closeContext)
    window.removeEventListener('resize', updateScrollState)
})

watch(
    [() => tabs.activeTabId, () => sortedTabs.value.length],
    () => nextTick(() => {
        if (tabs.activeTabId) revealTab(tabs.activeTabId)
        updateScrollState()
    }),
)
</script>

<template>
    <div
        v-if="sortedTabs.length > 0"
        class="border-b border-border bg-card flex items-center"
        @click="closeContext"
    >
        <div
            ref="tabScroll"
            data-slot="tabs-scroll"
            class="no-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain"
            @scroll="updateScrollState"
        >
            <div class="flex min-w-max items-center gap-1 px-2 py-1 pr-8 whitespace-nowrap">
                <div
                    v-for="t in sortedTabs"
                    :key="t.id"
                    :class="[
                        'group relative flex shrink-0 items-center gap-1.5 h-8 px-3 rounded-md text-sm cursor-pointer select-none border border-transparent',
                        isActive(t.id)
                            ? 'bg-secondary text-secondary-foreground font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    ]"
                    :ref="(element) => setTabElement(t.id, element)"
                    :data-tab-id="t.id"
                    @click="clickTab(t.id, t.fullPath)"
                    @contextmenu="showContext($event, t.id)"
                    @mousedown="middleClickClose($event, t)"
                >
                    <Icon
                        v-if="t.icon"
                        :icon="t.icon"
                        class="size-3.5 shrink-0"
                    />
                    <span class="truncate max-w-40">{{ tabTitle(t) }}</span>
                    <span
                        v-if="t.pinned"
                        class="text-[10px] text-muted-foreground/70"
                    >📌</span>
                    <button
                        v-if="t.closable"
                        type="button"
                        class="ml-1 size-4 rounded-sm inline-flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-foreground/10"
                        @click.stop="closeTabAndNavigate(t.id)"
                    >
                        <Icon icon="lucide:x" class="size-3" />
                    </button>
                </div>
            </div>
        </div>
        <button
            v-if="canScrollRight"
            data-slot="tabs-scroll-next"
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="显示更多标签"
            aria-label="显示更多标签"
            @click.stop="scrollTabsRight"
        >
            <Icon icon="lucide:chevron-right" class="size-4" />
        </button>
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
                @click="closeOthersAndNavigate(tabs.activeTabId ?? '')"
            >
                <Icon icon="lucide:x-circle" class="size-3.5" />
            </button>
            <button
                type="button"
                class="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                :title="tabs.maximizedTabId === tabs.activeTabId ? '退出最大化' : '最大化'"
                @click="tabs.maximizeTab(tabs.maximizedTabId === tabs.activeTabId ? null : tabs.activeTabId)"
            >
                <Icon :icon="tabs.maximizedTabId === tabs.activeTabId ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="size-3.5" />
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

<style>
[data-slot='tabs-scroll'] {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

[data-slot='tabs-scroll']::-webkit-scrollbar {
    display: none;
}
</style>
