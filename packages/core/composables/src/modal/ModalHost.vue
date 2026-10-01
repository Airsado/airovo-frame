<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { Icon } from '@airovo/shared/icons'
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@airovo/uikit-shadcnui'
import type { ModalApi } from './modal-api'
import type { ModalCloseReason } from './types'

const props = defineProps<{ api: ModalApi<any> }>()

let transitionTimer: ReturnType<typeof setTimeout> | undefined
let pendingPhase: 'opened' | 'closed' | undefined
let observedInitialState = false

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
})

function requestClose(reason: ModalCloseReason) {
    void props.api.close(reason)
}

function onUpdateOpen(open: boolean) {
    if (open) props.api.open()
    else requestClose('api')
}

function onEscape(event: Event) {
    event.preventDefault()
    if (props.api.state.closeOnEscape && !props.api.state.loading) requestClose('escape')
}

function onOutside(event: Event) {
    event.preventDefault()
    if (props.api.state.closeOnOutside && !props.api.state.loading) requestClose('outside')
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
    <Dialog :open="api.state.open" @update:open="onUpdateOpen">
        <DialogContent
            :show-close-button="false"
            :class="[
                'flex max-h-[min(85vh,42rem)] min-h-0 w-full flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl',
                api.state.contentClass,
            ]"
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
    </Dialog>
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
