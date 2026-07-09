/**
 * @airovo/design — Design tokens
 *
 * Centralized design system tokens for the airovo-frame ecosystem.
 * Use these instead of hardcoded values for visual consistency.
 */
export const tokens = {
    /** Brand palette — deep blue */
    brand: {
        50:  '#eef4ff',
        100: '#d9e6ff',
        200: '#b3cdff',
        300: '#84aeff',
        400: '#5687fa',
        500: '#3461f0',
        600: '#2349c7',
        700: '#1d3c9e',
        800: '#1a317b',
        900: '#182d65',
    },

    /** Accent — cyan for highlights */
    accent: {
        50:  '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
    },

    /** Neutral surface */
    surface: {
        0:    '#ffffff',
        50:   '#f9fafb',
        100:  '#f3f4f6',
        200:  '#e5e7eb',
        300:  '#d1d5db',
        400:  '#9ca3af',
        500:  '#6b7280',
        600:  '#4b5563',
        700:  '#374151',
        800:  '#1f2937',
        900:  '#111827',
    },

    /** Semantic colors */
    semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#3b82f6',
    },

    /** Gradients */
    gradient: {
        brand:   'linear-gradient(135deg, #3461f0 0%, #2349c7 100%)',
        accent:  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        sunset:  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        forest:  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        hero:    'linear-gradient(135deg, #3461f0 0%, #06b6d4 100%)',
    },

    /** Spacing scale (4px base) */
    space: {
        0:  '0px',
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
        16: '64px',
    },

    /** Border radius */
    radius: {
        none: '0px',
        sm:   '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl': '20px',
        full: '9999px',
    },

    /** Shadows */
    shadow: {
        xs: '0 1px 2px 0 rgba(0,0,0,0.04)',
        sm: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        md: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.04)',
        xl: '0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.04)',
    },

    /** Typography */
    font: {
        sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"JetBrains Mono", "Fira Code", monospace',
    },

    /** Z-index scale */
    z: {
        dropdown: 1000,
        sticky:   1100,
        overlay:  1200,
        modal:    1300,
        toast:    1400,
    },
    /** ───── Dark-mode overrides ───── */\n    dark: {\n        surface: {\n            0:    '#0a0a0a',\n            50:   '#111111',\n            100:  '#1a1a1a',\n            200:  '#27272a',\n            300:  '#3f3f46',\n            400:  '#52525b',\n            500:  '#71717a',\n            600:  '#a1a1aa',\n            700:  '#d4d4d8',\n            800:  '#e4e4e7',\n            900:  '#fafafa',\n        },\n        shadow: {\n            xs: '0 1px 2px 0 rgba(0,0,0,0.20)',\n            sm: '0 1px 3px 0 rgba(0,0,0,0.30), 0 1px 2px -1px rgba(0,0,0,0.20)',\n            md: '0 4px 6px -1px rgba(0,0,0,0.40), 0 2px 4px -2px rgba(0,0,0,0.20)',\n            lg: '0 10px 15px -3px rgba(0,0,0,0.50), 0 4px 6px -4px rgba(0,0,0,0.20)',\n            xl: '0 20px 25px -5px rgba(0,0,0,0.50), 0 8px 10px -6px rgba(0,0,0,0.20)',\n        },\n    },\n} as const\n\nexport type Tokens = typeof tokens\n\n/**\n * Generate CSS custom properties from the current tokens for use in\n * Tailwind or plain CSS. Call `injectTokens()` to apply them to\n * `document.documentElement.style`.\n */\nexport function tokensToCSSVars(mode: 'light' | 'dark' = 'light'): Record<string, string> {\n    const vars: Record<string, string> = {}\n    const surface = mode === 'dark' ? tokens.dark.surface : tokens.surface\n    const shadow = mode === 'dark' ? tokens.dark.shadow : tokens.shadow\n\n    // Brand\n    for (const [stop, value] of Object.entries(tokens.brand)) {\n        vars[`--brand-${stop}`] = value\n    }\n    // Accent\n    for (const [stop, value] of Object.entries(tokens.accent)) {\n        vars[`--accent-${stop}`] = value\n    }\n    // Surface (mode-aware)\n    for (const [stop, value] of Object.entries(surface)) {\n        vars[`--surface-${stop}`] = value\n    }\n    // Semantic\n    for (const [name, value] of Object.entries(tokens.semantic)) {\n        vars[`--semantic-${name}`] = value\n    }\n    // Radius\n    for (const [name, value] of Object.entries(tokens.radius)) {\n        vars[`--radius-${name}`] = String(value)\n    }\n    // Shadows (mode-aware)\n    for (const [name, value] of Object.entries(shadow)) {\n        vars[`--shadow-${name}`] = String(value)\n    }\n    // Font\n    vars['--font-sans'] = tokens.font.sans\n    vars['--font-mono'] = tokens.font.mono\n    // Z-index\n    for (const [name, value] of Object.entries(tokens.z)) {\n        vars[`--z-${name}`] = String(value)\n    }\n    return vars\n}\n\n/** Inject CSS custom properties into `documentElement`. */\nexport function injectTokens(mode: 'light' | 'dark' = 'light'): void {\n    const vars = tokensToCSSVars(mode)\n    for (const [key, value] of Object.entries(vars)) {\n        document.documentElement.style.setProperty(key, value)\n    }\n}
