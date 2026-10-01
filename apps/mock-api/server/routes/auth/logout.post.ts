import { defineEventHandler } from 'h3'
import { revokeSession } from '../../utils/auth'
import { readAuthBody } from '../../utils/http'

export default defineEventHandler(async (event) => {
    const body = await readAuthBody(event)
    revokeSession(body.refreshToken)
    return { ok: true }
})
