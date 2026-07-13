/**
 * RequestError — normalized error type for the request layer.
 *
 * Carries the HTTP status, the (optional) backend error code, and a
 * human-readable message. Apps can `instanceof` to detect network /
 * HTTP failures uniformly.
 */
export class RequestError extends Error {
    public readonly code?: string
    public readonly httpStatus?: number
    public readonly data?: unknown

    constructor(
        message: string,
        opts: { code?: string; httpStatus?: number; data?: unknown } = {},
    ) {
        super(message)
        this.name = 'RequestError'
        this.code = opts.code
        this.httpStatus = opts.httpStatus
        this.data = opts.data
        // Restore prototype chain for `instanceof` across realms.
        Object.setPrototypeOf(this, RequestError.prototype)
    }
}
