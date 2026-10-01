interface AirovoAppConfigRaw {
    VITE_GLOB_API_URL?: string
}

interface AirovoAppConfig {
    apiURL: string
}

declare global {
    interface Window {
        _AIROVO_APP_CONF_?: AirovoAppConfigRaw
    }
}

function readString(value: unknown, fallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : ''
    return normalized || fallback
}

function readBoolean(value: unknown, fallback: boolean): boolean {
    if (value == null || String(value).trim() === '') return fallback
    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase())
}

export function useAppConfig(
    env: Record<string, unknown> = import.meta.env,
    isProduction = import.meta.env.PROD,
): AirovoAppConfig {
    const raw = isProduction
        ? (globalThis.window?._AIROVO_APP_CONF_ ?? env)
        : env

    return {
        apiURL: readString(raw.VITE_GLOB_API_URL, '/api').replace(/\/$/, ''),
    }
}

const appName = readString(import.meta.env.VITE_APP_NAMESPACE, '__APP_NAME__')
const appTitle = readString(import.meta.env.VITE_APP_TITLE, '__APP_TITLE__')
export const appConfig = useAppConfig(import.meta.env, import.meta.env.PROD)

export const appEnv = {
    appName,
    appTitle,
    apiBase: appConfig.apiURL,
    base: readString(import.meta.env.VITE_BASE, '/'),
    devtools: readBoolean(import.meta.env.VITE_DEVTOOLS, false),
    injectAppLoading: readBoolean(import.meta.env.VITE_INJECT_APP_LOADING, true),
    nitroMock: readBoolean(import.meta.env.VITE_NITRO_MOCK, false),
    routerHistory: readString(import.meta.env.VITE_ROUTER_HISTORY, 'web') === 'hash' ? 'hash' as const : 'web' as const,
}
