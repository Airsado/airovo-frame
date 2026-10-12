<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import { provideOverlayOwner } from '@airovo/shared/overlay'
import { Button, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@airovo/uikit-shadcnui'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot } from 'reka-ui'
import { overlayStack, type OverlayHandle } from '../overlay/overlay-stack'
import type { DrawerApi } from './drawer-api'
import type { DrawerCloseReason } from './types'

const props = defineProps<{ api: DrawerApi<any, any> }>()

let transitionTimer: ReturnType<typeof setTimeout> | undefined
let pendingPhase: 'opened' | 'closed' | undefined
let observedInitialState = false
const stackHandle = shallowRef<OverlayHandle>()

provideOverlayOwner({
    active: computed(() => props.api.state.open && stackHandle.value?.isActive.value === true),
    popupZIndex: computed(() => stackHandle.value?.popupZIndex.value),
})

function syncStack(open: boolean) {
    // Reka owns the DOM lock for this host and its Select popups; keep the
    // framework stack responsible for ordering and opener restoration.
    if (open && !stackHandle.value) stackHandle.value = overlayStack.acquire({ lockBodyScroll: false })
    if (!open && stackHandle.value) {
        stackHandle.value.release()
        stackHandle.value = undefined
    }
}

function finishTransition(event?: AnimationEvent) {
    if (event && event.target !== event.currentTarget) return
    if (transitionTimer) clearTimeout(transitionTimer)
    transitionTimer = undefined
    const phase = pendingPhase
    pendingPhase = undefined
    if (phase === 'opened') props.api.notifyOpened()
    else if (phase === 'closed') props.api.notifyClosed()
}

watch(() => props.api.state.open, (open) => {
    syncStack(open)
    if (!observedInitialState) {
        observedInitialState = true
        if (!open) return
    }
    if (transitionTimer) clearTimeout(transitionTimer)
    pendingPhase = open ? 'opened' : 'closed'
    const reducedMotion = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    transitionTimer = setTimeout(() => finishTransition(), reducedMotion ? 0 : 220)
}, { immediate: true })

onBeforeUnmount(() => {
    if (transitionTimer) clearTimeout(transitionTimer)
    stackHandle.value?.release()
    stackHandle.value = undefined
})

function requestClose(reason: DrawerCloseReason) {
    void props.api.close(reason)
}

function onUpdateOpen(open: boolean) {
    if (open) props.api.open()
    else if (!props.api.state.loading && stackHandle.value?.isTop()) requestClose('api')
}

function onEscape(event: Event) {
    // Keep native dismissal from bypassing disabled/loading controller state.
    const prevented = event.defaultPrevented
    event.preventDefault()
    if (!prevented && stackHandle.value?.isTop() && props.api.state.closeOnEscape && !props.api.state.loading) {
        requestClose('escape')
    }
}

function onOutside(event: Event) {
    const original = (event as CustomEvent<{ originalEvent: PointerEvent }>).detail?.originalEvent
    const contextMenu = original?.button === 2 || (original?.button === 0 && original.ctrlKey)
    const prevented = event.defaultPrevented
    event.preventDefault()
    if (!prevented && !contextMenu && stackHandle.value?.isTop() && props.api.state.closeOnOutside && !props.api.state.loading) {
        requestClose('outside')
    }
}

async function confirm() {
    try {
        await props.api.confirm()
    } catch {
        // The controller keeps the error visible in the drawer body.
    }
}

async function cancel() {
    try {
        await props.api.cancel()
    } catch {
        // The controller keeps the error visible in the drawer body.
    }
}
</script>

<template>
    <DialogRoot :open="api.state.open" @update:open="onUpdateOpen">
        <DialogPortal>
            <DialogOverlay
                class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/10 supports-[backdrop-filter]:backdrop-blur-xs"
                :style="stackHandle ? { zIndex: stackHandle.overlayZIndex.value } : undefined"
            />
            <DialogContent
                :class="[
                    'bg-background text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col overflow-hidden text-sm shadow-lg outline-none duration-200',
                    api.side === 'right'
                        ? 'inset-y-0 right-0 h-full w-[min(100%,28rem)] max-w-[90vw] rounded-l-xl border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
                        : 'inset-x-0 bottom-0 max-h-[80vh] rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                    api.state.contentClass,
                ]"
                :style="stackHandle ? { zIndex: stackHandle.zIndex.value } : undefined"
                @escape-key-down="onEscape"
                @pointer-down-outside="onOutside"
                @animation-end="finishTransition"
            >
                <div v-if="api.side === 'bottom'" class="bg-muted mx-auto mt-3 h-1 w-24 shrink-0 rounded-full" />
                <div class="flex shrink-0 items-start justify-between gap-3 px-4 py-3 sm:px-5">
                    <DialogHeader class="min-w-0 flex-1 text-left">
                        <DialogTitle v-if="api.state.title" class="text-base font-semibold">{{ api.state.title }}</DialogTitle>
                        <DialogTitle v-else class="sr-only">抽屉</DialogTitle>
                        <DialogDescription v-if="api.state.description" class="text-sm">{{ api.state.description }}</DialogDescription>
                    </DialogHeader>
                    <Button
                        v-if="api.state.showCloseButton"
                        type="button"
                        size="icon"
                        variant="ghost"
                        class="size-7 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="关闭抽屉"
                        aria-label="关闭抽屉"
                        :disabled="api.state.loading"
                        @click="requestClose('close-button')"
                    >
                        <Icon icon="lucide:x" class="size-4" />
                    </Button>
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5" :aria-busy="api.state.loading">
                    <slot :api="api" :data="api.getData()" />
                    <p v-if="api.state.error" role="alert" class="mt-3 text-sm text-destructive">{{ api.state.error }}</p>
                </div>

                <DialogFooter v-if="api.state.footer" class="mt-auto shrink-0 border-t px-4 py-3 sm:px-5">
                    <slot name="footer" :api="api" :data="api.getData()">
                        <Button v-if="api.state.showCancel" type="button" variant="outline" :disabled="api.state.loading" @click="cancel">
                            {{ api.state.cancelText }}
                        </Button>
                        <Button v-if="api.state.showConfirm" type="button" :disabled="api.state.loading || api.state.confirmDisabled" @click="confirm">
                            <Icon v-if="api.state.loading" icon="lucide:loader-circle" class="size-4 animate-spin" />
                            {{ api.state.confirmText }}
                        </Button>
                    </slot>
                </DialogFooter>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<style scoped>
.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklch, var(--color-foreground) 18%, transparent) transparent;
}

.overflow-y-auto::-webkit-scrollbar { width: 8px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb {
    background: color-mix(in oklch, var(--color-foreground) 18%, transparent);
    border: 2px solid transparent;
    border-radius: 999px;
    background-clip: padding-box;
}
</style>
