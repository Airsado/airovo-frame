import { defineEventHandler, getHeader } from 'h3'
import { bearerToken, sessionFromAccessToken } from '../../utils/auth'
import { unauthorized } from '../../utils/http'

export default defineEventHandler((event) => {
    const session = sessionFromAccessToken(bearerToken(getHeader(event, 'authorization')))
    if (!session) unauthorized()
    return { user: session.user }
})
