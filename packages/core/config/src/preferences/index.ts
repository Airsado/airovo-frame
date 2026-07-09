export type {
    AppPreferences,
    DeepPartial,
    HeaderPreferences,
    LocaleCode,
    LocalePreferences,
    MenusMod,
    Preferences,
    PreferencesExtension,
    PreferencesField,
    ThemeMode,
    ThemePreferences,
} from './types'
export { frameworkDefaultPreferences } from './defaults'
export { deepMerge } from './merge'
export { defineOverridesPreferences, definePreferencesExtension } from './helpers'
export { resolvePreferences } from './resolve'
export { preferenceManager } from './manager'