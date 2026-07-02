import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { createLayoutsI18n } from '@airovo/layouts'
import { createPinia, useI18nStore } from '@airovo/stores'
import { piniaPersist } from '@airovo/stores'
import type { Locale } from '@airovo/stores/i18n'
import { usePreferencesStore } from '@airovo/stores/preferences'

import { appRouter } from './router'
import { appOverrides } from './preferences'

const pinia = createPinia()
pinia.use(piniaPersist)

const i18n = createLayoutsI18n()

const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.use(appRouter.router)

// Apply app-level overrides on top of framework defaults before mount
// so the layout reads the final preferences on first paint.
usePreferencesStore().applyOverrides(appOverrides)

useI18nStore().bindExternal(
    (i18n as unknown as { global: { locale: { value: Locale } } }).global.locale,
)

app.mount('#app')

// Surface the router for quick dev inspection.
;(window as unknown as { __appRouter: typeof appRouter }).__appRouter = appRouter