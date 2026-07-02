import { useColorMode } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
    theme: Theme
    prefersDark: boolean
    isDark: boolean
}

/**
 * Convert vueuse's `useColorMode` value to the framework's
 * `Theme` type. `useColorMode` exposes `'light' | 'dark' | 'auto'`;
 * we expose `'light' | 'dark' | 'system'` (the existing API).
 */
function fromUseColorMode(v: 'light' | 'dark' | 'auto'): Theme {
    return v === 'auto' ? 'system' : v
}

function toUseColorMode(t: Theme): 'light' | 'dark' | 'auto' {
    return t === 'system' ? 'auto' : t
}

export const useThemeStore = defineStore(
    'theme',
    () => {
        // `useColorMode` handles: media-query listening, `class="dark"`
        // toggling on <html>, and localStorage persistence via useStorage.
        //
        // We map its `'auto'` value to our `'system'` Theme. The `modes`
        // map ensures we only ADD `dark` to <html>'s class list (and
        // leave it untouched in light mode) so other classes on <html>
        // are preserved.
        const colorMode = useColorMode<'light' | 'dark' | 'auto'>({
            attribute: 'class',
            selector: 'html',
            storageKey: 'airovo-theme',
            modes: {
                light: '',
                dark: 'dark',
                auto: '',
            },
        })

        // Public-facing `Theme` value (with `'system'` instead of `'auto'`)
        const theme = computed<Theme>({
            get: () => fromUseColorMode(colorMode.value),
            set: (v) => {
                colorMode.value = toUseColorMode(v)
            },
        })

        // `useColorMode` doesn't expose the OS-level preference
        // separately — we mirror it here so consumers can read it.
        const prefersDark = ref(false)
        if (typeof window !== 'undefined') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)')
            prefersDark.value = mq.matches
            mq.addEventListener('change', (e) => {
                prefersDark.value = e.matches
            })
        }

        const isDark = computed(
            () => theme.value === 'dark' || (theme.value === 'system' && prefersDark.value),
        )

        function toggle(): void {
            theme.value = isDark.value ? 'light' : 'dark'
        }

        return { theme, prefersDark, isDark, toggle, _raw: colorMode }
    },
    {
        // Disable the store-level persistence — `useColorMode` already
        // persists via useStorage under `storageKey: 'airovo-theme'`.
        persist: false,
    },
)
