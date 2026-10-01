import { defineEventHandler, getHeader, setHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
    const origin = getHeader(event, 'origin')
    if (origin && /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin)) {
        setHeader(event, 'Vary', 'Origin')
        setHeader(event, 'Access-Control-Allow-Origin', origin)
        setHeader(event, 'Access-Control-Allow-Credentials', 'true')
        // Keep this list aligned with the headers installed by the demo app's
        // application-owned request setup. Without the custom headers the
        // browser rejects the preflight before the auth endpoint is reached.
        setHeader(event, 'Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-Source, Accept-Language')
        setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    }
    if (event.method === 'OPTIONS') {
        setResponseStatus(event, 204)
        return null
    }
})
