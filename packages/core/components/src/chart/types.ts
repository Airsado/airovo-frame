import type { ChartConfig } from '@airovo/uikit-shadcnui'

export type FrameworkChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar'
export type FrameworkChartData = ChartConfig['data']
export type FrameworkChartOptions = ChartConfig['options']

export interface ChartLegendItem {
    label: string
    color: string
}
