/**
 * ChartPlugin — CSS-variable-driven color resolution.
 *
 * Reads the shadcn-vue --color-chart-1 … --color-chart-5 variables
 * from the document root (set in globals.css) and maps them onto the
 * chart dataset's `backgroundColor` / `borderColor` so the chart
 * picks up the active theme (light/dark/system) automatically.
 */

export interface ChartConfig {
    data: {
        labels?: string[]
        datasets: Array<{
            label?: string
            data: number[]
            backgroundColor?: string | string[]
            borderColor?: string | string[]
            [key: string]: any
        }>
    }
    options?: Record<string, any>
}

const PALETTE_VAR_NAMES = [
    '--color-chart-1',
    '--color-chart-2',
    '--color-chart-3',
    '--color-chart-4',
    '--color-chart-5',
] as const

function readPalette(): string[] {
    if (typeof document === 'undefined') return []
    const cs = getComputedStyle(document.documentElement)
    return PALETTE_VAR_NAMES.map((name) => {
        const v = cs.getPropertyValue(name).trim()
        return v || `hsl(${[220, 160, 50, 30, 280][PALETTE_VAR_NAMES.indexOf(name)]} 70% 50%)`
    })
}

export function resolveChartColors(input: any): any {
    if (!input || !Array.isArray(input.datasets)) return input
    const palette = readPalette()
    const datasets = input.datasets.map((ds: any, i: number) => {
        const color = palette[i % palette.length] ?? '#888'
        return {
            ...ds,
            backgroundColor: ds.backgroundColor ?? color,
            borderColor: ds.borderColor ?? color,
        }
    })
    return { ...input, datasets }
}
