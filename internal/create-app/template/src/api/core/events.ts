import { appEnv } from '../../config/env'

/** URL builder for the demo's SSE endpoint; auth transport stays in request. */
export function getDemoEventsUrl(): string {
    return `${appEnv.apiBase}/demo/events`
}
