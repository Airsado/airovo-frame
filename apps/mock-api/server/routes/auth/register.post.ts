import { defineEventHandler, setResponseStatus } from 'h3'
import { badRequest, readAuthBody } from '../../utils/http'
import { ACCESS_EXPIRES_IN, createUser, findUser, issueSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const body = await readAuthBody(event)
    const username = body.username?.trim()
    const email = body.email?.trim()
    if (!username || !email || !body.password) badRequest('username, email and password are required')
    if (findUser(username)) badRequest('username already exists', 'USERNAME_EXISTS')

    const session = issueSession(createUser({ username, email, password: body.password }))
    setResponseStatus(event, 201)
    return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: ACCESS_EXPIRES_IN,
        user: session.user,
    }
})
