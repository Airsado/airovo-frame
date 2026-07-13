/**
 * useEventSource — thin Server-Sent Events composable.
 */
import { onBeforeUnmount, ref, shallowRef } from 'vue'

export type EventSourceState = 'connecting' | 'open' | 'closed'

export interface UseEventSourceOptions {
    url: string
    /** Auto-reconnect on error. Default: true */
    reconnect?: boolean
    reconnectDelay?: number
    /** If provided, listen to this named event instead of the default message stream. */
    eventName?: string
    onMessage?: (data: any, event: MessageEvent) => void
    onOpen?: (event: Event) => void
    onError?: (event: Event) => void
}

export function useEventSource(options: UseEventSourceOptions) {
    const state = ref<EventSourceState>('closed')
    const source = shallowRef<EventSource | null>(null)
    const reconnectTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)

    function clearTimer() {
        if (reconnectTimer.value) {
            clearTimeout(reconnectTimer.value)
            reconnectTimer.value = null
        }
    }

    function connect() {
        if (typeof EventSource === 'undefined') return
        state.value = 'connecting'
        const es = new EventSource(options.url)
        source.value = es

        es.addEventListener('open', (event) => {
            state.value = 'open'
            options.onOpen?.(event)
        })
        es.addEventListener('error', (event) => {
            state.value = 'closed'
            options.onError?.(event)
            es.close()
            source.value = null
            if (options.reconnect !== false) {
                reconnectTimer.value = setTimeout(
                    connect,
                    options.reconnectDelay ?? 3000,
                )
            }
        })
        const target = options.eventName ? es : es
        target.addEventListener(options.eventName ?? 'message', (ev) => {
            const me = ev as MessageEvent
            let data: any = me.data
            if (typeof data === 'string') {
                try { data = JSON.parse(data) } catch { /* leave as string */ }
            }
            options.onMessage?.(data, me)
        })
    }

    function close() {
        clearTimer()
        options.reconnect = false
        source.value?.close()
        source.value = null
        state.value = 'closed'
    }

    connect()

    onBeforeUnmount(() => {
        options.reconnect = false
        clearTimer()
        source.value?.close()
        source.value = null
    })

    return { state, source, close }
}
