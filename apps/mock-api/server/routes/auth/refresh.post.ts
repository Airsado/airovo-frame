import { defineEventHandler } from 'h3'
import { ACCESS_EXPIRES_IN, rotateSession } from '../../utils/auth'
import { readAuthBody, unauthorized } from '../../utils/http'

export default defineEventHandler(async (event) => {
    const body = await readAuthBody(event)
    const session = body.refreshToken ? rotateSession(body.refreshToken) : null
    if (!session) unauthorized('Refresh token is invalid or expired')
    return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: ACCESS_EXPIRES_IN,
    }
})
