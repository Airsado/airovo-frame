import type { AppRequestClient } from './request'

export interface HealthStatus {
    ok?: boolean
    service?: string
    timestamp?: string
}

/** Requests used by the demo pages, kept with the app's other API modules. */
export function createDemoApi(request: AppRequestClient) {
    return {
        async health(): Promise<HealthStatus> {
            const response = await request.get<HealthStatus>('/health')
            return response.data
        },
        async protectedResources(concurrent: boolean): Promise<unknown[]> {
            const resources = concurrent ? ['one', 'two'] : ['single']
            const responses = await Promise.all(
                resources.map((resource) => request.get(`/demo/protected/${resource}`)),
            )
            return responses.map((response) => response.data)
        },
    }
}
