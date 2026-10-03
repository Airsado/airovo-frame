<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import {
    Button,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@airovo/uikit-shadcnui'
import {
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
} from 'reka-ui'
import { overlayStack, type OverlayHandle } from '../overlay/overlay-stack'
import type { ModalApi } from './modal-api'
import type { ModalCloseReason } from './types'

const props = defineProps<{ api: ModalApi<any, any> }>()

let transitionTimer: ReturnType<typeof setTimeout> | undefined
let pendingPhase: 'opened' | 'closed' | undefined
let observedInitialState = false
let stackHandle: OverlayHandle | undefined

function syncStack(open: boolean) {
    if (open && !stackHandle) stackHandle = overlayStack.acquire()
    if (!open && stackHandle) {
        stackHandle.release()
        stackHandle = undefined
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
    stackHandle?.release()
    stackHandle = undefined
})

function requestClose(reason: ModalCloseReason) {
    void props.api.close(reason)
}

function onUpdateOpen(open: boolean) {
    if (open) props.api.open()
    else if (!stackHandle || stackHandle.isTop()) requestClose('api')
}

function onEscape(event: Event) {
    if (stackHandle?.isTop() && props.api.state.closeOnEscape && !props.api.state.loading) {
        event.preventDefault()
        requestClose('escape')
    }
}

function onOutside(event: Event) {
    if (stackHandle?.isTop() && props.api.state.closeOnOutside && !props.api.state.loading) {
        event.preventDefault()
        requestClose('outside')
    }
}

async function confirm() {
    try {
        await props.api.confirm()
    } catch {
        // The controller keeps the error visible in the modal body.
    }
}

async function cancel() {
    try {
        await props.api.cancel()
    } catch {
        // The controller keeps the error visible in the modal body.
    }
}
</script>

<template>
    <DialogRoot :open="api.state.open" @update:open="onUpdateOpen">
        <DialogPortal>
            <DialogOverlay
                class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
                :style="stackHandle ? { zIndex: stackHandle.overlayZIndex.value } : undefined"
            />
            <DialogContent
                :class="[
                    'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 fixed top-[50%] left-[50%] z-50 flex max-h-[min(85vh,42rem)] min-h-0 w-full translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-xl border p-0 shadow-lg duration-200 sm:max-w-xl',
                    api.state.contentClass,
                ]"
                :style="stackHandle ? { zIndex: stackHandle.zIndex.value } : undefined"
                @escape-key-down="onEscape"
                @pointer-down-outside="onOutside"
                @animation-end="finishTransition"
            >
            <div class="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <DialogHeader class="min-w-0 flex-1 text-left">
                    <DialogTitle v-if="api.state.title" class="text-sm font-semibold sm:text-base">{{ api.state.title }}</DialogTitle>
                    <DialogTitle v-else class="sr-only">对话框</DialogTitle>
                    <DialogDescription v-if="api.state.description" class="text-xs sm:text-sm">{{ api.state.description }}</DialogDescription>
                </DialogHeader>
                <Button
                    v-if="api.state.showCloseButton"
                    type="button"
                    size="icon"
                    variant="ghost"
                    class="size-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
                    title="关闭对话框"
                    aria-label="关闭对话框"
                    :disabled="api.state.loading"
                    @click="requestClose('close-button')"
                >
                    <Icon icon="lucide:x" class="size-4" />
                </Button>
            </div>

            <div class="modal-body min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" :aria-busy="api.state.loading">
                <slot :api="api" :data="api.getData()" />
                <p v-if="api.state.error" role="alert" class="mt-3 text-sm text-destructive">{{ api.state.error }}</p>
            </div>

            <DialogFooter v-if="api.state.footer" class="shrink-0 border-t px-4 py-3 sm:px-5">
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
.modal-body {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklch, var(--color-foreground) 18%, transparent) transparent;
}

.modal-body::-webkit-scrollbar { width: 8px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb {
    background: color-mix(in oklch, var(--color-foreground) 18%, transparent);
    border: 2px solid transparent;
    border-radius: 999px;
    background-clip: padding-box;
}
</style>
