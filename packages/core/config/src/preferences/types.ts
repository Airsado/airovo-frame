import type { MenusMod } from '@airovo/router'

export type { MenusMod }
export type ThemeMode = 'light' | 'dark' | 'system'
export type LocaleCode = 'zh-CN' | 'en-US'

/** Recursive partial — makes every property optional at every depth. */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface AppPreferences {
    /** App identifier — used in `<title>` and brand text. */
    name: string
    /** Page title shown in `<title>` tag and brand area. Falls back to `name`. */
    title: string
    /** Path that `/` redirects to. The router reads this when no explicit `homePath` is passed. */
    homePath: string
    /** Where the sidebar menu ultimately comes from. The router reads this when no explicit `menusMod` is passed. */
    menusMod: MenusMod
    /** Optional logo URL for the site title block. */
    logo?: string
}

export type GrayColor = 'zinc' | 'slate' | 'gray' | 'neutral' | 'stone'
export type LayoutDensity = 'compact' | 'default' | 'loose'

export interface ThemePreferences {
    mode: ThemeMode
    /** Primary color hex. Empty string means "use the css variable default". */
    primaryColor?: string
    /** Neutral palette family for surfaces & borders. */
    grayColor?: GrayColor
    /** Corner radius token (CSS rem). Default 0.5. */
    radius?: number
    /** Layout density — drives spacing/padding tokens. */
    layoutDensity?: LayoutDensity
    /** Disable CSS transitions/animations when false. */
    animationEnabled?: boolean
    /** Grayscale filter applied to the entire app. */
    weakMode?: boolean
}

export interface LocalePreferences {
    current: LocaleCode
    fallback: LocaleCode
}

export interface HeaderPreferences {
    showSearch: boolean
    showMessages: boolean
    showLanguage: boolean
    showTheme: boolean
}

/**
 * Flat shape — matches the vben V5 style. Namespaced sub-objects keep
 * the surface area legible when extending via `definePreferencesExtension`.
 *
 * Apps that need additional keys should declare a project-local
 * interface and pass it as the generic to `definePreferencesExtension<T>`.
 * The framework does NOT read those custom keys; the settings drawer
 * (a future iteration) will.
 */
export interface Preferences {
    app: AppPreferences
    theme: ThemePreferences
    locale: LocalePreferences
    header: HeaderPreferences
}

/**
 * Field descriptor for the settings drawer UI. The `key` is a path
 * into the Preferences object (e.g. `'app.homePath'`). The framework
 * does not consume this type today; it exists so apps can declare
 * extensions with full typing.
 *
 * The generic `T` lets an app augment which keys the drawer knows about.
 */
export interface PreferencesField<T = Preferences> {
    component: 'Switch' | 'Select' | 'InputNumber' | 'Input'
    /** Dotted path into Preferences, or a free-form key for app extensions. */
    key: keyof T | string
    label: string
    defaultValue: unknown
    options?: { label: string; value: unknown }[]
    componentProps?: Record<string, unknown>
    tip?: string
}

export interface PreferencesExtension<T = Preferences> {
    /** Label shown on the settings drawer tab. */
    tabLabel: string
    /** Title of the section inside the tab. */
    title: string
    fields: PreferencesField<T>[]
}