import { defineEventHandler } from 'h3'

export default defineEventHandler(() => ({
    ok: true,
    service: 'framework-mock-api',
    timestamp: new Date().toISOString(),
}))
