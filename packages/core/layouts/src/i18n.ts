import { createI18n } from 'vue-i18n'

import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const layoutsMessages = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

/**
 * Create a vue-i18n instance pre-loaded with the layout's own messages
 * (sidebar labels, header labels, etc.). Apps can merge their own
 * messages on top via `mergeLocaleMessage`.
 */
export function createLayoutsI18n() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createI18n({
        legacy: false,
        locale: 'zh-CN',
        fallbackLocale: 'zh-CN',
        globalInjection: true,
        messages: layoutsMessages,
    })
}
