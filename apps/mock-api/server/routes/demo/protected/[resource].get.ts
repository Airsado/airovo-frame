import { defineEventHandler, getHeader, getRouterParam } from 'h3'
import { bearerToken, sessionFromAccessToken } from '../../../utils/auth'
import { unauthorized } from '../../../utils/http'

export default defineEventHandler((event) => {
    const session = sessionFromAccessToken(bearerToken(getHeader(event, 'authorization')))
    if (!session) unauthorized('access token expired')
    return {
        ok: true,
        endpoint: `/demo/protected/${getRouterParam(event, 'resource') ?? 'unknown'}`,
        username: session.user.username,
    }
})
