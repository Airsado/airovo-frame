import { defineStore } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
    theme: Theme
    prefersDark: boolean
    isDark: boolean
}

export const useThemeStore = defineStore(
    'theme',
    () => {
        const theme = ref<Theme>('system')
        const prefersDark = ref(false)

        const isDark = computed(
            () => theme.value === 'dark' || (theme.value === 'system' && prefersDark.value),
        )

        function applyDarkClass(dark: boolean): void {
            document.documentElement.classList.toggle('dark', dark)
        }

        function updatePrefersDark(): void {
            prefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        }

        let mediaQuery: MediaQueryList | null = null
        function onMediaChange(e: MediaQueryListEvent): void {
            prefersDark.value = e.matches
        }

        function setTheme(t: Theme): void {
            theme.value = t
        }

        function toggle(): void {
            theme.value = isDark.value ? 'light' : 'dark'
        }

        function init(): void {
            updatePrefersDark()
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            mediaQuery.addEventListener('change', onMediaChange)
            applyDarkClass(isDark.value)
        }

        function dispose(): void {
            mediaQuery?.removeEventListener('change', onMediaChange)
            mediaQuery = null
        }

        watch(isDark, applyDarkClass)

        return { theme, prefersDark, isDark, setTheme, toggle, init, dispose }
    },
    {
        persist: {
            key: 'airovo-theme',
            storage: localStorage,
            pick: ['theme'],
        },
    },
)
