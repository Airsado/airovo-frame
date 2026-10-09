// @vitest-environment happy-dom
import { createApp, defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    useEventSource,
    useEventSourceSession,
    type EventSourceFactory,
    type EventSourceLike,
} from '../src/useEventSource'

class FakeEventSource implements EventSourceLike {
    static instances: FakeEventSource[] = []
    readonly listeners = new Map<string, Set<(event: Event) => void>>()
    closed = false

    constructor(
        readonly url: string,
        readonly init: { lastEventId?: string | null } = {},
    ) {
        FakeEventSource.instances.push(this)
    }

    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        const callback = typeof listener === 'function'
            ? listener
            : (event: Event) => listener.handleEvent(event)
        const set = this.listeners.get(type) ?? new Set<(event: Event) => void>()
        set.add(callback)
        this.listeners.set(type, set)
    }

    close() {
        this.closed = true
    }

    emit(type: string, data: unknown = undefined, lastEventId = '') {
        const event = type === 'error' && data && typeof data === 'object' && !('data' in data)
            ? data as Event
            : { type, data, lastEventId } as MessageEvent
        for (const callback of this.listeners.get(type) ?? []) callback(event)
    }
}

function factory(): EventSourceFactory {
    return (url, options) => new FakeEventSource(url, options)
}

describe('useEventSource', () => {
    beforeEach(() => {
        FakeEventSource.instances = []
        vi.useRealTimers()
    })

    it('injects a factory, parses JSON, and restores Last-Event-ID', () => {
        const messages: unknown[] = []
        const stream = useEventSource({
            url: '/events?tenant=demo',
            eventSourceFactory: factory(),
            reconnect: false,
            onMessage: (data) => messages.push(data),
        })
        const first = FakeEventSource.instances[0]
        first.emit('open')
        first.emit('message', '{"event":"progress","value":1}', 'evt-1')
        expect(messages).toEqual([{ event: 'progress', value: 1 }])
        expect(stream.lastEventId.value).toBe('evt-1')
        stream.retry()
        expect(FakeEventSource.instances[1].url).toContain('lastEventId=evt-1')
        expect(FakeEventSource.instances[1].init.lastEventId).toBe('evt-1')
    })

    it('uses exponential reconnect delays and stops after max attempts', () => {
        vi.useFakeTimers()
        const reconnects: Array<[number, number]> = []
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            reconnectDelay: 100,
            maxReconnectAttempts: 2,
            reconnectJitter: 0,
            onReconnect: (attempt, delay) => reconnects.push([attempt, delay]),
        })
        FakeEventSource.instances[0].emit('error', { type: 'error' } as Event)
        expect(stream.state.value).toBe('reconnecting')
        expect(reconnects).toEqual([[1, 100]])
        vi.advanceTimersByTime(99)
        expect(FakeEventSource.instances).toHaveLength(1)
        vi.advanceTimersByTime(1)
        expect(FakeEventSource.instances).toHaveLength(2)
        FakeEventSource.instances[1].emit('error', { type: 'error' } as Event)
        expect(reconnects).toEqual([[1, 100], [2, 200]])
        vi.advanceTimersByTime(200)
        expect(FakeEventSource.instances).toHaveLength(3)
        FakeEventSource.instances[2].emit('error', { type: 'error' } as Event)
        expect(stream.state.value).toBe('failed')
    })

    it('stops reconnecting on complete and exposes pause/resume controls', () => {
        vi.useFakeTimers()
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            reconnectDelay: 10,
        })
        const first = FakeEventSource.instances[0]
        first.emit('open')
        first.emit('message', JSON.stringify({ event: 'complete', id: 'done' }), 'done')
        expect(stream.state.value).toBe('completed')
        vi.advanceTimersByTime(100)
        expect(FakeEventSource.instances).toHaveLength(1)
        stream.pause()
        expect(stream.state.value).toBe('completed')

        const second = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            autoConnect: false,
            reconnect: true,
        })
        second.connect()
        expect(second.state.value).toBe('connecting')
        second.pause()
        expect(second.state.value).toBe('paused')
        second.resume()
        expect(second.state.value).toBe('connecting')
    })

    it('enters failed terminal state for a protocol error event', () => {
        const terminalError = vi.fn()
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            onTerminalError: terminalError,
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        source.emit('message', JSON.stringify({ event: 'error', message: 'worker failed' }), 'err-1')
        expect(stream.state.value).toBe('failed')
        expect(terminalError).toHaveBeenCalledWith('worker failed', expect.anything())
    })

    it('handles a named error event as terminal failure without reconnecting', () => {
        const terminalError = vi.fn()
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            reconnect: false,
            onTerminalError: terminalError,
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        source.emit('error', JSON.stringify({ message: 'named worker failed' }), 'err-2')

        expect(stream.state.value).toBe('failed')
        expect(stream.lastEventId.value).toBe('err-2')
        expect(terminalError).toHaveBeenCalledOnce()
        expect(terminalError).toHaveBeenCalledWith('named worker failed', expect.anything())
        expect(FakeEventSource.instances).toHaveLength(1)
    })

    it('does not register a duplicate listener for an explicit error event name', () => {
        const terminalError = vi.fn()
        const stream = useEventSource({
            url: '/events',
            eventName: 'error',
            eventSourceFactory: factory(),
            reconnect: false,
            onTerminalError: terminalError,
        })
        const source = FakeEventSource.instances[0]
        expect(source.listeners.get('error')).toHaveLength(1)
        source.emit('error', JSON.stringify({ message: 'explicit worker failed' }), 'err-3')

        expect(stream.state.value).toBe('failed')
        expect(terminalError).toHaveBeenCalledOnce()
    })

    it('reconnects after a heartbeat timeout', () => {
        vi.useFakeTimers()
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            heartbeatTimeout: 25,
            reconnectDelay: 10,
        })
        FakeEventSource.instances[0].emit('open')
        vi.advanceTimersByTime(24)
        expect(stream.state.value).toBe('open')
        vi.advanceTimersByTime(1)
        expect(stream.state.value).toBe('reconnecting')
        vi.advanceTimersByTime(10)
        expect(FakeEventSource.instances).toHaveLength(2)
    })

    it('does not let ordinary messages hide a missed heartbeat', () => {
        vi.useFakeTimers()
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            heartbeatTimeout: 25,
            reconnect: false,
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        vi.advanceTimersByTime(20)
        source.emit('message', JSON.stringify({ event: 'progress', progress: 50 }))
        vi.advanceTimersByTime(5)

        expect(stream.state.value).toBe('disconnected')
    })

    it('resets the watchdog only for heartbeat events', () => {
        vi.useFakeTimers()
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            heartbeatTimeout: 25,
            reconnect: false,
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        vi.advanceTimersByTime(20)
        source.emit('heartbeat', JSON.stringify({ event: 'heartbeat', heartbeat: true }))
        vi.advanceTimersByTime(20)
        expect(stream.state.value).toBe('open')
        vi.advanceTimersByTime(5)
        expect(stream.state.value).toBe('disconnected')
    })

    it('retries a disconnected stream on demand', () => {
        const stream = useEventSource({
            url: '/events',
            eventSourceFactory: factory(),
            reconnect: false,
        })
        FakeEventSource.instances[0].emit('error', { type: 'error' } as Event)

        expect(stream.state.value).toBe('disconnected')
        stream.retry()

        expect(stream.state.value).toBe('connecting')
        expect(FakeEventSource.instances).toHaveLength(2)
    })

    it('closes the active source and cancels pending reconnect on unmount', () => {
        vi.useFakeTimers()
        let stream: ReturnType<typeof useEventSource> | undefined
        const Root = defineComponent({
            setup() {
                stream = useEventSource({
                    url: '/events',
                    eventSourceFactory: factory(),
                    reconnectDelay: 100,
                })
                return () => h('div')
            },
        })
        const host = document.createElement('div')
        document.body.append(host)
        const app = createApp(Root)
        app.mount(host)
        const source = FakeEventSource.instances[0]
        source.emit('error', { type: 'error' } as Event)
        expect(stream?.state.value).toBe('reconnecting')

        app.unmount()
        expect(source.closed).toBe(true)
        vi.advanceTimersByTime(500)
        expect(FakeEventSource.instances).toHaveLength(1)
        host.remove()
    })
})

describe('useEventSourceSession', () => {
    afterEach(() => { vi.restoreAllMocks() })
    beforeEach(() => {
        FakeEventSource.instances = []
    })

    it('deduplicates ids and drops the oldest item at the bound', () => {
        const session = useEventSourceSession<{ message: string }>({
            url: '/logs',
            eventSourceFactory: factory(),
            reconnect: false,
            maxItems: 2,
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        source.emit('message', JSON.stringify({ id: '1', message: 'one' }), '1')
        source.emit('message', JSON.stringify({ id: '1', message: 'duplicate' }), '1')
        source.emit('message', JSON.stringify({ id: '2', message: 'two' }), '2')
        source.emit('message', JSON.stringify({ id: '3', message: 'three' }), '3')
        expect(session.items.value.map((item) => item.id)).toEqual(['2', '3'])
        expect(session.status.value).toBe('running')
        session.clear()
        expect(session.items.value).toEqual([])
        expect(session.totalBytes.value).toBe(0)
    })

    it('enforces maxBytes by dropping the oldest items', () => {
        const second = { id: '2', message: 'two' }
        const maxBytes = new TextEncoder().encode(JSON.stringify(second)).byteLength
        const session = useEventSourceSession<{ message: string }>({
            url: '/logs',
            eventSourceFactory: factory(),
            reconnect: false,
            maxBytes,
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        source.emit('message', JSON.stringify({ id: '1', message: 'one' }), '1')
        source.emit('message', JSON.stringify(second), '2')

        expect(session.items.value.map((item) => item.id)).toEqual(['2'])
        expect(session.totalBytes.value).toBeLessThanOrEqual(maxBytes)
    })

    it('supports drop-newest buffer semantics', () => {
        const retained: string[] = []
        const session = useEventSourceSession<{ message: string }>({
            url: '/logs',
            eventSourceFactory: factory(),
            reconnect: false,
            maxItems: 2,
            dropOldest: false,
            onItem: (item) => retained.push(item.id ?? ''),
        })
        const source = FakeEventSource.instances[0]
        source.emit('open')
        source.emit('message', JSON.stringify({ id: '1', message: 'one' }), '1')
        source.emit('message', JSON.stringify({ id: '2', message: 'two' }), '2')
        source.emit('message', JSON.stringify({ id: '3', message: 'three' }), '3')

        expect(session.items.value.map((item) => item.id)).toEqual(['1', '2'])
        expect(retained).toEqual(['1', '2'])
    })

    it.each([
        { dedupe: true, maxItems: 1, maxBytes: undefined },
        { dedupe: false, maxItems: 1, maxBytes: undefined },
        { dedupe: true, maxItems: undefined, maxBytes: 26 },
        { dedupe: false, maxItems: undefined, maxBytes: 26 },
    ])('bounds the ID index across 10,000 events (dedupe=$dedupe, maxItems=$maxItems, maxBytes=$maxBytes)', ({ dedupe, maxItems, maxBytes }) => {
        // Observe the private collection without exposing a test-only runtime API.
        const indexes = new Set<Set<string>>()
        const originalAdd = Set.prototype.add
        vi.spyOn(Set.prototype, 'add').mockImplementation(function (this: Set<unknown>, value: unknown) {
            if (typeof value === 'string' && value.startsWith('bounded-')) originalAdd.call(indexes, this)
            return originalAdd.call(this, value)
        })
        const session = useEventSourceSession({ url: '/logs', eventSourceFactory: factory(), reconnect: false, maxItems, maxBytes, dedupe })
        const source = FakeEventSource.instances.at(-1)!
        for (let id = 0; id < 10_000; id++) source.emit('message', JSON.stringify({ id: `bounded-${id}` }), `bounded-${id}`)
        expect(session.items.value).toHaveLength(1)
        if (dedupe) {
            expect(indexes.size).toBe(1)
            expect([...indexes][0].size).toBe(1)
        } else expect(indexes.size).toBe(0)
        session.clear()
        for (const index of indexes) expect(index.size).toBe(0)
    })

    it('allows replay only after an ID leaves the retained byte window', () => {
        const data = { id: '1', message: 'one' }
        const session = useEventSourceSession({ url: '/logs', eventSourceFactory: factory(), reconnect: false, maxBytes: new TextEncoder().encode(JSON.stringify(data)).byteLength })
        const source = FakeEventSource.instances.at(-1)!
        source.emit('message', JSON.stringify(data), '1')
        source.emit('message', JSON.stringify({ id: '2', message: 'two' }), '2')
        source.emit('message', JSON.stringify(data), '1')
        expect(session.items.value.map(item => item.id)).toEqual(['1'])
        source.emit('message', JSON.stringify(data), '1')
        expect(session.items.value).toHaveLength(1)
    })

    it('does not index messages rejected by drop-newest or an oversized item', () => {
        const added = vi.spyOn(Set.prototype, 'add')
        const session = useEventSourceSession({ url: '/logs', eventSourceFactory: factory(), reconnect: false, maxItems: 1, maxBytes: 80, dropOldest: false })
        const source = FakeEventSource.instances.at(-1)!
        source.emit('message', JSON.stringify({ id: 'retained' }), 'retained')
        source.emit('message', JSON.stringify({ id: 'rejected-newest' }), 'rejected-newest')
        source.emit('message', JSON.stringify({ id: 'rejected-large', message: 'x'.repeat(100) }), 'rejected-large')
        expect(added).not.toHaveBeenCalledWith('rejected-newest')
        expect(added).not.toHaveBeenCalledWith('rejected-large')
        expect(session.items.value.map(item => item.id)).toEqual(['retained'])
        session.clear()
        source.emit('message', JSON.stringify({ id: 'rejected-newest' }), 'rejected-newest')
        expect(session.items.value.map(item => item.id)).toEqual(['rejected-newest'])
    })

    it('removes even an oversized incoming ID when drop-oldest evicts the whole buffer', () => {
        const indexes = new Set<Set<string>>()
        const originalAdd = Set.prototype.add
        vi.spyOn(Set.prototype, 'add').mockImplementation(function (this: Set<unknown>, value: unknown) {
            if (typeof value === 'string' && value.startsWith('oversized-')) originalAdd.call(indexes, this)
            return originalAdd.call(this, value)
        })
        const session = useEventSourceSession({ url: '/logs', eventSourceFactory: factory(), reconnect: false, maxBytes: 80 })
        const source = FakeEventSource.instances.at(-1)!
        source.emit('message', JSON.stringify({ id: 'oversized-retained' }), 'oversized-retained')
        source.emit('message', JSON.stringify({ id: 'oversized-large', message: 'x'.repeat(100) }), 'oversized-large')
        expect(session.items.value).toEqual([])
        expect(session.totalBytes.value).toBe(0)
        for (const index of indexes) expect(index.size).toBe(0)
        source.emit('message', JSON.stringify({ id: 'oversized-large' }), 'oversized-large')
        expect(session.items.value.map(item => item.id)).toEqual(['oversized-large'])
    })

    it('normalizes numeric IDs, keeps Last-Event-ID outside the cache and preserves pause/terminal behavior', () => {
        const session = useEventSourceSession({ url: '/logs', eventSourceFactory: factory(), reconnect: false, maxItems: 1 })
        const source = FakeEventSource.instances.at(-1)!
        source.emit('message', JSON.stringify({ id: 0, message: 'zero' }))
        source.emit('message', JSON.stringify({ id: '0', message: 'duplicate' }))
        expect(session.items.value).toHaveLength(1)
        expect(session.items.value[0].id).toBe('0')
        session.clear()
        expect(session.lastEventId.value).toBe('0')
        session.pause()
        expect(session.status.value).toBe('paused')
        session.resume()
        const resumed = FakeEventSource.instances.at(-1)!
        expect(resumed.init.lastEventId).toBe('0')
        resumed.emit('message', JSON.stringify({ id: 0, message: 'new zero' }))
        expect(session.items.value).toHaveLength(1)
        resumed.emit('complete', JSON.stringify({ id: 'done' }), 'done')
        expect(session.status.value).toBe('completed')
        session.retry()
        const retried = FakeEventSource.instances.at(-1)!
        expect(retried.init.lastEventId).toBe('done')
        retried.emit('error', JSON.stringify({ id: 'failed', message: 'failure' }), 'failed')
        expect(session.status.value).toBe('failed')
    })
})
