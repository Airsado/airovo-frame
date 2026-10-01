export type MetricTone = 'default' | 'info' | 'success' | 'warning' | 'danger'

export interface Metric {
    key: string
    label: string
    value: string | number
    hint?: string
    icon?: string
    tone?: MetricTone
    loading?: boolean
}
