import { defineEventHandler, getHeader, getQuery, setHeader } from 'h3'

interface EventPayload {
    id: number
    event: 'progress' | 'message' | 'heartbeat' | 'complete' | 'error'
    data: Record<string, unknown>
}

function writeEvent(response: { write: (chunk: string) => boolean }, payload: EventPayload): void {
    response.write(`id: ${payload.id}\n`)
    response.write(`event: ${payload.event}\n`)
    response.write(`data: ${JSON.stringify({ id: payload.id, event: payload.event, ...payload.data })}\n\n`)
}

/** Small local-only SSE stream used by the ComponentsDemo page. */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const start = Math.max(
        0,
        Number(getHeader(event, 'last-event-id') ?? query.lastEventId ?? 0) || 0,
    )
    const shouldFail = String(query.fail ?? '') === 'true'
    const response = event.node.res as unknown as {
        writeHead: (status: number, headers: Record<string, string>) => void
        write: (chunk: string) => boolean
        end: () => void
    }
    setHeader(event, 'content-type', 'text/event-stream')
    setHeader(event, 'cache-control', 'no-cache, no-transform')
    setHeader(event, 'connection', 'keep-alive')
    response.writeHead?.(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    })

    const events = ([
        { id: 1, event: 'progress', data: { progress: 20, message: '读取任务' } },
        { id: 2, event: 'message', data: { message: '任务已开始' } },
        { id: 3, event: 'heartbeat', data: { heartbeat: true } },
        { id: 4, event: 'progress', data: { progress: 70, message: '处理数据' } },
        shouldFail
            ? { id: 5, event: 'error', data: { message: '模拟任务失败' } }
            : { id: 5, event: 'complete', data: { progress: 100, message: '任务完成' } },
    ] as EventPayload[]).filter((item) => item.id > start)

    let index = 0
    const interval = Math.max(50, Number(process.env.NITRO_SSE_INTERVAL ?? 450) || 450)
    await new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setInterval> | undefined
        let settled = false
        const cleanup = () => {
            if (settled) return
            settled = true
            if (timer) clearInterval(timer)
            timer = undefined
            response.end?.()
            resolve()
        }
        timer = setInterval(() => {
            const next = events[index++]
            if (!next) {
                cleanup()
                return
            }
            writeEvent(response, next)
            if (next.event === 'complete' || next.event === 'error') cleanup()
        }, interval)
        event.node.req.once('close', cleanup)
    })
})
