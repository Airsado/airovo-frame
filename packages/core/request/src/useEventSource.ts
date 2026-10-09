/**
 * Server-Sent Events transport and bounded session helpers.
 *
 * The transport intentionally knows nothing about Axios, application response
 * envelopes, or DOM log rendering. Applications can inject a factory when
 * they need a custom authentication transport (for example fetch streams or
 * a test EventSource implementation). The browser EventSource fallback uses
 * a query parameter for the last event id because native EventSource does not
 * allow arbitrary request headers.
 */
import { computed, getCurrentInstance, onBeforeUnmount, ref, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

export type EventSourceState =
    | 'connecting'
    | 'open'
    | 'reconnecting'
    | 'paused'
    | 'closed'
    | 'disconnected'
    | 'completed'
    | 'failed'

export type EventSourceTerminalState = 'completed' | 'failed'

export type EventSourceProtocolEvent =
    | 'message'
    | 'progress'
    | 'heartbeat'
    | 'complete'
    | 'error'

/**
 * The id type accepted by the SSE protocol and by the Last-Event-ID bridge.
 * Native EventSource exposes ids as strings, while local mock and fetch
 * transports often keep numeric ids until they cross the wire.
 */
export type EventSourceEventId = string | number

/**
 * Common application payload envelope for the framework's protocol events.
 * The fields are optional because native SSE payloads are not required to
 * use a nested `data` member: the Nitro demo sends `id`, `event`, and its
 * event-specific fields in one JSON object. Applications can provide a
 * concrete `TData` when they use a nested data payload.
 */
export interface EventSourceProtocolPayload<TData = unknown> {
    id?: EventSourceEventId
    event: EventSourceProtocolEvent
    data?: TData
    progress?: number
    heartbeat?: boolean
    message?: string
    error?: unknown
}

export type EventSourceMessagePayload<TData = unknown> = EventSourceProtocolPayload<TData> & {
    event: 'message'
}

export type EventSourceProgressPayload<TData = unknown> = EventSourceProtocolPayload<TData> & {
    event: 'progress'
    progress?: number
}

export type EventSourceHeartbeatPayload<TData = unknown> = EventSourceProtocolPayload<TData> & {
    event: 'heartbeat'
    heartbeat?: boolean
}

export type EventSourceCompletePayload<TData = unknown> = EventSourceProtocolPayload<TData> & {
    event: 'complete'
}

export type EventSourceErrorPayload<TData = unknown> = EventSourceProtocolPayload<TData> & {
    event: 'error'
}

/** Discriminated event payload union used by typed application adapters. */
export type EventSourceProtocolEventPayload<TData = unknown> =
    | EventSourceMessagePayload<TData>
    | EventSourceProgressPayload<TData>
    | EventSourceHeartbeatPayload<TData>
    | EventSourceCompletePayload<TData>
    | EventSourceErrorPayload<TData>

export interface EventSourceLike {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
    removeEventListener?(type: string, listener: EventListenerOrEventListenerObject): void
    close(): void
    readonly readyState?: number
}

export interface EventSourceFactoryOptions {
    withCredentials?: boolean
    /** Last received SSE id. Custom factories may send it as a header. */
    lastEventId?: string | null
}

export type EventSourceFactory = (
    url: string,
    options: EventSourceFactoryOptions,
) => EventSourceLike

/** Union keeps callbacks written for the original Event-only API assignable. */
export type EventSourceErrorHandler =
    | ((event: Event) => void)
    | ((error: Error) => void)

export interface UseEventSourceOptions {
    url: string
    /** Auto-reconnect on connection errors. Default: true. */
    reconnect?: boolean
    /** Base reconnect delay in milliseconds. Default: 3000. */
    reconnectDelay?: number
    /** Maximum delay after exponential backoff. Defaults to no cap. */
    maxReconnectDelay?: number
    /** Add bounded random jitter to each reconnect delay. Default: 0. */
    reconnectJitter?: number | ((delay: number, attempt: number) => number)
    /** Maximum consecutive reconnect attempts. Default: Infinity. */
    maxReconnectAttempts?: number
    /** If provided, listen to this named event instead of the default stream. */
    eventName?: string
    /** Native EventSource credentials flag. */
    withCredentials?: boolean
    /** Seed the last event id when restoring a stream. */
    lastEventId?: string | null
    /** Query parameter used by the native EventSource fallback. Set false to disable. */
    lastEventIdParam?: string | false
    /** Heartbeat watchdog timeout. Set 0 (default) to disable. */
    heartbeatTimeout?: number
    /** Custom EventSource implementation, also used by tests. */
    eventSourceFactory?: EventSourceFactory
    /** Auto-connect immediately. Default: true for backwards compatibility. */
    autoConnect?: boolean
    onMessage?: (data: unknown, event: MessageEvent) => void
    onEvent?: (type: EventSourceProtocolEvent | string, data: unknown, event: MessageEvent) => void
    onOpen?: (event: Event) => void
    onError?: EventSourceErrorHandler
    onComplete?: (event: MessageEvent) => void
    onTerminalError?: (error: unknown, event?: MessageEvent) => void
    onReconnect?: (attempt: number, delay: number) => void
    onReconnectExhausted?: (attempts: number, error?: unknown) => void
}

export interface UseEventSourceReturn {
    state: Ref<EventSourceState>
    source: ShallowRef<EventSourceLike | null>
    lastEventId: Ref<string | null>
    reconnectAttempts: Ref<number>
    /** Alias for reconnectAttempts for transport-facing callers. */
    attempt: Ref<number>
    lastError: ShallowRef<unknown | null>
    connect: () => void
    close: () => void
    pause: () => void
    resume: () => void
    retry: () => void
}

function parseMessageData(raw: unknown): unknown {
    if (typeof raw !== 'string') return raw
    try {
        return JSON.parse(raw)
    } catch {
        return raw
    }
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : undefined
}

function getProtocolEvent(data: unknown, event: MessageEvent): EventSourceProtocolEvent | string {
    const record = getRecord(data)
    const value = record?.event ?? record?.type ?? event.type
    return typeof value === 'string' && value.length > 0 ? value : 'message'
}

function getRecordId(data: unknown): string | undefined {
    const value = getRecord(data)?.id
    return value === undefined || value === null ? undefined : String(value)
}

function appendLastEventId(url: string, param: string | false, id: string | null): string {
    if (param === false || !id) return url
    const hashIndex = url.indexOf('#')
    const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
    const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url
    const encodedParam = encodeURIComponent(param)
    const escapedParam = encodedParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const existing = new RegExp(`([?&])${escapedParam}=[^&#]*`)
    if (existing.test(base)) {
        return `${base.replace(existing, `$1${encodedParam}=${encodeURIComponent(id)}`)}${hash}`
    }
    const separator = base.includes('?') ? (base.endsWith('?') || base.endsWith('&') ? '' : '&') : '?'
    return `${base}${separator}${encodedParam}=${encodeURIComponent(id)}${hash}`
}

function defaultEventSourceFactory(url: string, options: EventSourceFactoryOptions): EventSourceLike {
    if (typeof EventSource === 'undefined') {
        throw new Error('EventSource is not available in this environment')
    }
    return new EventSource(url, { withCredentials: options.withCredentials })
}

function notifyError(handler: EventSourceErrorHandler | undefined, error: Event | Error) {
    const callback = handler as unknown as ((value: Event | Error) => void) | undefined
    callback?.(error)
}

/**
 * Manage one SSE connection. The old API remains valid; new callers can use
 * pause/resume/retry, injected factories, terminal protocol events, bounded
 * exponential reconnects, and a heartbeat watchdog.
 */
export function useEventSource(options: UseEventSourceOptions): UseEventSourceReturn {
    const state = ref<EventSourceState>('closed')
    const source = shallowRef<EventSourceLike | null>(null)
    const lastEventId = ref<string | null>(options.lastEventId ?? null)
    const reconnectAttempts = ref(0)
    const lastError = shallowRef<unknown | null>(null)
    const reconnectTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)
    const heartbeatTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)

    let autoReconnect = options.reconnect !== false
    let terminal = false
    let generation = 0
    let activeGeneration = 0

    function clearReconnectTimer() {
        if (reconnectTimer.value !== null) {
            clearTimeout(reconnectTimer.value)
            reconnectTimer.value = null
        }
    }

    function clearHeartbeatTimer() {
        if (heartbeatTimer.value !== null) {
            clearTimeout(heartbeatTimer.value)
            heartbeatTimer.value = null
        }
    }

    function clearTimers() {
        clearReconnectTimer()
        clearHeartbeatTimer()
    }

    function closeSource() {
        const current = source.value
        source.value = null
        current?.close()
    }

    function getReconnectDelay(attempt: number): number {
        const base = Math.max(0, options.reconnectDelay ?? 3000)
        const uncapped = base * 2 ** Math.max(0, attempt - 1)
        const capped = Math.min(uncapped, options.maxReconnectDelay ?? Number.POSITIVE_INFINITY)
        const jitter = options.reconnectJitter ?? 0
        const value = typeof jitter === 'function'
            ? jitter(capped, attempt)
            : capped + Math.max(0, jitter) * Math.random()
        return Math.max(0, Math.round(value))
    }

    function scheduleReconnect(error?: unknown) {
        if (!autoReconnect || terminal || reconnectTimer.value !== null) return
        const maxAttempts = options.maxReconnectAttempts ?? Number.POSITIVE_INFINITY
        if (reconnectAttempts.value >= maxAttempts) {
            state.value = 'failed'
            lastError.value = error ?? lastError.value
            options.onReconnectExhausted?.(reconnectAttempts.value, error)
            return
        }
        const attempt = reconnectAttempts.value + 1
        reconnectAttempts.value = attempt
        const delay = getReconnectDelay(attempt)
        state.value = 'reconnecting'
        options.onReconnect?.(attempt, delay)
        reconnectTimer.value = setTimeout(() => {
            reconnectTimer.value = null
            connect()
        }, delay)
    }

    function resetHeartbeatWatchdog() {
        clearHeartbeatTimer()
        const timeout = options.heartbeatTimeout ?? 0
        if (timeout <= 0 || terminal || state.value !== 'open') return
        heartbeatTimer.value = setTimeout(() => {
            heartbeatTimer.value = null
            const error = new Error('SSE heartbeat timeout')
            lastError.value = error
            notifyError(options.onError, error)
            closeSource()
            state.value = 'disconnected'
            scheduleReconnect(error)
        }, timeout)
    }

    function updateLastEventId(data: unknown, event: MessageEvent) {
        const value = event.lastEventId || getRecordId(data)
        if (value) lastEventId.value = String(value)
    }

    function complete(event: MessageEvent) {
        terminal = true
        autoReconnect = false
        clearTimers()
        closeSource()
        state.value = 'completed'
        options.onComplete?.(event)
    }

    function fail(error: unknown, event?: MessageEvent) {
        terminal = true
        autoReconnect = false
        clearTimers()
        closeSource()
        lastError.value = error
        state.value = 'failed'
        options.onTerminalError?.(error, event)
    }

    function handleMessage(rawEvent: Event) {
        if (generation !== activeGeneration) return
        const event = rawEvent as MessageEvent
        const data = parseMessageData(event.data)
        updateLastEventId(data, event)
        const kind = getProtocolEvent(data, event)
        // A heartbeat watchdog measures heartbeat traffic specifically. Normal
        // progress/message events must not hide a dead connection whose
        // heartbeat has stopped arriving.
        if (kind === 'heartbeat') resetHeartbeatWatchdog()
        options.onMessage?.(data, event)

        options.onEvent?.(kind, data, event)
        if (kind === 'complete') {
            complete(event)
        } else if (kind === 'error') {
            const record = getRecord(data)
            fail(record?.error ?? record?.message ?? data, event)
        }
    }

    function handleOpen(rawEvent: Event) {
        if (generation !== activeGeneration) return
        state.value = 'open'
        reconnectAttempts.value = 0
        lastError.value = null
        resetHeartbeatWatchdog()
        options.onOpen?.(rawEvent)
    }

    function handleConnectionError(rawEvent: Event | Error) {
        if (generation !== activeGeneration || terminal) return
        // A named SSE `error` event can be delivered as a MessageEvent. The
        // protocol event path handles that payload instead of reconnecting.
        if (
            (typeof MessageEvent !== 'undefined' && rawEvent instanceof MessageEvent)
            || ('data' in Object(rawEvent))
        ) {
            handleMessage(rawEvent as Event)
            return
        }
        notifyError(options.onError, rawEvent)
        lastError.value = rawEvent
        clearHeartbeatTimer()
        closeSource()
        state.value = 'disconnected'
        scheduleReconnect(rawEvent)
    }

    function connect() {
        if (terminal || state.value === 'paused' || source.value) return
        clearReconnectTimer()
        state.value = 'connecting'
        const factory = options.eventSourceFactory ?? defaultEventSourceFactory
        // SSR and test environments may not expose a native EventSource. The
        // previous helper treated that as a no-op; preserve that behavior
        // instead of scheduling an endless reconnect timer.
        if (!options.eventSourceFactory && typeof EventSource === 'undefined') {
            state.value = 'closed'
            return
        }
        const currentGeneration = ++generation
        activeGeneration = currentGeneration
        const url = appendLastEventId(options.url, options.lastEventIdParam ?? 'lastEventId', lastEventId.value)
        let next: EventSourceLike
        try {
            next = factory(url, {
                withCredentials: options.withCredentials,
                lastEventId: lastEventId.value,
            })
        } catch (error) {
            lastError.value = error
            notifyError(options.onError, error as Error)
            state.value = 'disconnected'
            scheduleReconnect(error)
            return
        }
        source.value = next
        const guard = (handler: (event: Event) => void) => (event: Event) => {
            if (source.value !== next || generation !== currentGeneration) return
            handler(event)
        }

        next.addEventListener('open', guard(handleOpen))
        next.addEventListener('error', guard(handleConnectionError))
        // Keep the legacy `eventName` behavior: when a caller selects a
        // named stream, unrelated events are not delivered to its callback.
        // The protocol event channels are subscribed automatically only for
        // the default stream.
        const eventNames = new Set<string>()
        if (options.eventName && options.eventName !== 'error') {
            eventNames.add(options.eventName)
        } else if (!options.eventName) {
            eventNames.add('message')
            eventNames.add('progress')
            eventNames.add('heartbeat')
            eventNames.add('complete')
        }
        // `error` is already registered above as the transport listener. A
        // named SSE `error` event arrives there as a MessageEvent with data
        // and is routed through handleMessage(); adding a second listener
        // would process the same event twice.
        for (const eventName of eventNames) {
            next.addEventListener(eventName, guard(handleMessage))
        }
    }

    function close() {
        terminal = false
        autoReconnect = false
        clearTimers()
        closeSource()
        state.value = 'closed'
    }

    function pause() {
        if (state.value === 'completed' || state.value === 'failed') return
        autoReconnect = false
        clearTimers()
        closeSource()
        state.value = 'paused'
    }

    function resume() {
        if (state.value !== 'paused' && state.value !== 'disconnected' && state.value !== 'closed') return
        terminal = false
        autoReconnect = true
        reconnectAttempts.value = 0
        // `connect()` intentionally ignores a paused stream. Move back to a
        // neutral state before reconnecting so resume cannot become a no-op.
        state.value = 'closed'
        connect()
    }

    function retry() {
        terminal = false
        autoReconnect = true
        clearTimers()
        closeSource()
        reconnectAttempts.value = 0
        connect()
    }

    if (options.autoConnect !== false) connect()

    if (getCurrentInstance()) {
        onBeforeUnmount(() => {
            autoReconnect = false
            terminal = true
            clearTimers()
            closeSource()
        })
    }

    return {
        state,
        source,
        lastEventId,
        reconnectAttempts,
        attempt: reconnectAttempts,
        lastError,
        connect,
        close,
        pause,
        resume,
        retry,
    }
}

export type EventSourceSessionStatus =
    | 'idle'
    | 'connecting'
    | 'running'
    | 'paused'
    | 'disconnected'
    | 'completed'
    | 'failed'

export interface EventSourceSessionItem<T = unknown> {
    id?: string
    event: string
    data: T
    bytes: number
    receivedAt: number
}

export interface UseEventSourceSessionOptions<T = unknown> extends UseEventSourceOptions {
    maxItems?: number
    maxBytes?: number
    /** Keep heartbeat events in the bounded item buffer. Default: false. */
    includeHeartbeat?: boolean
    /** Drop oldest items when a bound is reached. Default: true. */
    dropOldest?: boolean
    /** Deduplicate IDs in the retained buffer only. Evicted IDs can be replayed. Default: true. */
    dedupe?: boolean
    onItem?: (item: EventSourceSessionItem<T>) => void
}

export function useEventSourceSession<T = unknown>(options: UseEventSourceSessionOptions<T>) {
    // Keep generic payloads opaque to Vue's deep ref unwrapping. This lets
    // `EventSourceSessionItem<T>` remain exactly `T` for callers whose payload
    // contains refs or other deeply typed objects.
    const items = ref<EventSourceSessionItem<T>[]>([]) as Ref<EventSourceSessionItem<T>[]>
    const totalBytes = ref(0)
    const seenIds = new Set<string>()
    const transportError = shallowRef<unknown | null>(null)

    const bytesOf = (value: unknown): number => {
        let text: string
        if (typeof value === 'string') text = value
        else {
            try {
                text = JSON.stringify(value) ?? ''
            } catch {
                text = String(value)
            }
        }
        if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).byteLength
        return text.length
    }

    const append = (data: unknown, event: MessageEvent) => {
        const kind = getProtocolEvent(data, event)
        if (kind === 'heartbeat' && options.includeHeartbeat !== true) return
        const id = event.lastEventId || getRecordId(data)
        if (options.dedupe !== false && id && seenIds.has(id)) return
        const item: EventSourceSessionItem<T> = {
            id,
            event: kind,
            data: data as T,
            bytes: bytesOf(data),
            receivedAt: Date.now(),
        }
        const maxItems = Math.max(0, options.maxItems ?? 1000)
        const maxBytes = Math.max(0, options.maxBytes ?? Number.POSITIVE_INFINITY)

        // In drop-newest mode, reject the incoming item before publishing it
        // to consumers. `onItem` describes items retained by this bounded
        // session, so callers never process an item that the buffer discarded.
        if (options.dropOldest === false && (
            items.value.length >= maxItems
            || item.bytes > maxBytes
            || totalBytes.value + item.bytes > maxBytes
        )) return

        items.value.push(item)
        // Index only accepted items. The index shares the buffer's lifetime
        // and bounds; Last-Event-ID belongs to the independent transport.
        if (options.dedupe !== false && id) seenIds.add(id)
        totalBytes.value += item.bytes
        while (items.value.length > maxItems || totalBytes.value > maxBytes) {
            const removed = options.dropOldest === false ? items.value.pop() : items.value.shift()
            if (!removed) break
            totalBytes.value -= removed.bytes
            if (removed.id) seenIds.delete(removed.id)
        }
        if (items.value.includes(item)) options.onItem?.(item)
    }

    const transport = useEventSource({
        ...options,
        onMessage(data, event) {
            append(data, event)
            options.onMessage?.(data, event)
        },
        onOpen(event) {
            transportError.value = null
            options.onOpen?.(event)
        },
        onError(error: Event | Error) {
            transportError.value = error
            notifyError(options.onError, error)
        },
        onComplete(event) {
            options.onComplete?.(event)
        },
        onTerminalError(error, event) {
            transportError.value = error
            options.onTerminalError?.(error, event)
        },
    })

    const status = computed<EventSourceSessionStatus>(() => {
        switch (transport.state.value) {
            case 'open': return 'running'
            case 'connecting':
            case 'reconnecting': return 'connecting'
            case 'paused': return 'paused'
            case 'disconnected': return 'disconnected'
            case 'completed': return 'completed'
            case 'failed': return 'failed'
            default: return 'idle'
        }
    })

    function clear() {
        items.value = []
        totalBytes.value = 0
        seenIds.clear()
    }

    return {
        ...transport,
        items,
        totalBytes,
        status,
        error: transportError,
        clear,
    }
}
