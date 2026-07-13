import type { DeepPartial } from './types'
import type { Preferences } from './types'

import { reactive, readonly, watch } from 'vue'

import { deepMerge } from './merge'
import { frameworkDefaultPreferences } from './defaults'

const STORAGE_PREFIX = 'airovo-preferences'

class PreferenceManager {
    private isInitialized = false
    private namespace = ''
    private state!: Preferences
    private initialPreferences!: Preferences
    private saveTimer: ReturnType<typeof setTimeout> | null = null

    constructor() {
        this.resetState()
    }

    /** Initialize with namespace and optional overrides. */
    async initPreferences({
        namespace,
        overrides,
    }: {
        namespace: string
        overrides?: DeepPartial<Preferences>
    }): Promise<void> {
        if (this.isInitialized) return

        this.namespace = namespace
        // Priority: cached > overrides > framework defaults
        this.initialPreferences = deepMerge<Preferences>(
            frameworkDefaultPreferences as Preferences,
            overrides ?? {},
        )

        // Load cached prefs (highest priority)
        const cached = this.loadFromCache()
        if (cached) {
            Object.assign(this.state, deepMerge<Preferences>(this.initialPreferences, cached))
        } else {
            Object.assign(this.state, this.initialPreferences)
        }

        // Apply to DOM
        this.applyTheme()
        this.setupWatchers()
        this.isInitialized = true
    }

    /** Get current preferences (readonly). */
    getPreferences(): Readonly<Preferences> {
        return readonly(this.state)
    }

    /** Partially update preferences, merge + persist + apply. */
    updatePreferences(updates: DeepPartial<Preferences>): void {
        const merged = deepMerge<Preferences>(this.state, updates)
        Object.assign(this.state, merged)
        this.handleUpdates(updates)
        this.debouncedSave()
    }

    /** Reset to initial defaults. */
    resetPreferences(): void {
        Object.assign(this.state, this.initialPreferences)
        this.applyTheme()
        this.saveToCache()
    }

    // ── private ──

    private resetState(): void {
        this.state = reactive<Preferences>({
            app: { name: '', title: '', homePath: '/', menusMod: 'frontend' },
            theme: { mode: 'system', primaryColor: '' },
            locale: { current: 'zh-CN', fallback: 'zh-CN' },
            header: { showSearch: true, showMessages: true, showLanguage: true, showTheme: true },
        })
    }

    private storageKey(): string {
        return `${STORAGE_PREFIX}-${this.namespace}`
    }

    private loadFromCache(): Preferences | null {
        try {
            const raw = localStorage.getItem(this.storageKey())
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    }

    private saveToCache(): void {
        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.state))
        } catch (e) {
            console.error('[PreferenceManager] Failed to save to cache:', e)
        }
    }

    private debouncedSave(): void {
        if (this.saveTimer) clearTimeout(this.saveTimer)
        this.saveTimer = setTimeout(() => this.saveToCache(), 150)
    }

    private handleUpdates(updates: DeepPartial<Preferences>): void {
        const { theme } = updates
        if (theme && (Reflect.has(theme, 'mode') || Reflect.has(theme, 'primaryColor'))) {
            this.applyTheme()
        }
    }

    /** Resolve actual theme mode and toggle dark class. */
    private applyTheme(): void {
        const mode = this.resolveTheme()
        const isDark = mode === 'dark'
        document.documentElement.classList.toggle('dark', isDark)
        // CSS variables are managed by the design package (Tailwind dark: variants)
    }

    private resolveTheme(): 'light' | 'dark' {
        const mode = this.state.theme.mode
        if (mode === 'light' || mode === 'dark') return mode
        // system
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return 'light'
    }

    private setupWatchers(): void {
        // Watch for system color scheme changes in 'system' mode
        if (typeof window !== 'undefined' && window.matchMedia) {
            window
                .matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', ({ matches }) => {
                    if (this.state.theme.mode === 'system') {
                        this.applyTheme()
                    }
                })
        }

        // Watch theme changes in state and apply
        watch(
            () => this.state.theme.mode,
            () => this.applyTheme(),
        )
    }
}

/** Singleton instance — one per app. */
export const preferenceManager = new PreferenceManager()
