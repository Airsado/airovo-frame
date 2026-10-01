import { defineEventHandler, setResponseStatus } from 'h3'
import { badRequest, readAuthBody, unauthorized } from '../../utils/http'
import { ACCESS_EXPIRES_IN, issueSession, verifyCredentials } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const body = await readAuthBody(event)
    if (!body.username || !body.password) badRequest('username and password are required')
    const user = verifyCredentials(body.username, body.password)
    if (!user) unauthorized('Invalid username or password', 'INVALID_CREDENTIALS')
    const session = issueSession(user)
    setResponseStatus(event, 200)
    return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: ACCESS_EXPIRES_IN,
        user: session.user,
    }
})
