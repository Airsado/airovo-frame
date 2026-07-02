import { frameworkDefaultPreferences } from './defaults'
import { deepMerge } from './merge'
import type { Preferences } from './types'

/**
 * Produce the final preferences object for an app by merging app
 * overrides on top of framework defaults. Pure function — does not
 * mutate either input.
 */
export function resolvePreferences(overrides: Partial<Preferences> = {}): Preferences {
    return deepMerge(frameworkDefaultPreferences, overrides)
}