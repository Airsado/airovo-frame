import type { DeepPartial, Preferences, PreferencesExtension } from './types'

/**
 * Identity helper whose only job is to give a typed name to a partial
 * `Preferences` object produced by an app. Apps write:
 *
 * ```ts
 * export const appOverrides = defineOverridesPreferences({
 *     app: { title: 'My App', homePath: '/home' },
 * })
 * ```
 *
 * Pure typing / IDE-intent marker — runtime does nothing. Generic is
 * preserved so narrow literal types flow through to consumers.
 */
export function defineOverridesPreferences<T extends Partial<Preferences>>(
    overrides: T,
): T {
    return overrides
}

/**
 * Typed identity helper for the application preferences file.
 * The name mirrors the public contract while keeping the runtime completely
 * framework agnostic.
 */
export function definePreferences<T extends DeepPartial<Preferences>>(preferences: T): T {
    return preferences
}

/**
 * Settings-drawer field descriptor. Identity helper — returns its
 * argument typed. The generic `T` lets an app extend which keys the
 * drawer knows about:
 *
 * ```ts
 * interface ProjectPreferencesExtension {
 *     defaultTableSize: number
 *     tenantMode: 'multi' | 'single'
 * }
 * export default definePreferencesExtension<ProjectPreferencesExtension>({
 *     tabLabel: 'preferences.project.tabLabel',
 *     title: 'preferences.project.title',
 *     fields: [
 *         { component: 'InputNumber', key: 'defaultTableSize', label: '...', defaultValue: 20 },
 *     ],
 * })
 * ```
 *
 * Lower-level PreferenceManager integrations may use these descriptors.
 * The framework's createApp() startup contract accepts only preferences.
 */
export function definePreferencesExtension<
    T extends Record<string, unknown> = Record<string, unknown>,
>(
    extension: PreferencesExtension<T & Preferences>,
): PreferencesExtension<T & Preferences> {
    return extension
}
