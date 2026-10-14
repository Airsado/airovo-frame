export type StatusVariant =
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'processing'
    | 'pending'
    | 'disabled'
    | 'info'
    | 'neutral'
    | 'purple'
    | 'amber'
    | 'blue'
    | 'cyan'
    | 'green'
    | 'grey'
    | 'indigo'
    | 'light-blue'
    | 'light-green'
    | 'lime'
    | 'orange'
    | 'pink'
    | 'red'
    | 'teal'
    | 'violet'
    | 'yellow'

export const statusPresets = {
    active: { variant: 'success' as const, label: 'Active' },
    inactive: { variant: 'neutral' as const, label: 'Inactive' },
    invited: { variant: 'info' as const, label: 'Invited' },
    suspended: { variant: 'danger' as const, label: 'Suspended' },
    pending: { variant: 'warning' as const, label: 'Pending', pulse: true },
} as const

/** Existing callers use StatusPreset as the full status variant union. */
export type StatusPreset = StatusVariant
/** Keys available in the new-api display preset map. */
export type StatusPresetName = keyof typeof statusPresets
export type StatusBadgeType = 'badge' | 'text' | 'underline'
export type StatusBadgeSize = 'sm' | 'md' | 'lg'

export const STATUS_PRESET_LABEL: Partial<Record<StatusPreset, string>> = {
    success: '成功',
    error: '失败',
    warning: '警告',
    processing: '进行中',
    pending: '等待中',
    disabled: '已停用',
    info: '提示',
    neutral: '草稿',
}

export const STATUS_PRESET_ICON: Partial<Record<StatusPreset, string>> = {
    success: 'lucide:check-circle-2',
    error: 'lucide:x-circle',
    warning: 'lucide:alert-triangle',
    processing: 'lucide:loader-circle',
    pending: 'lucide:clock',
    disabled: 'lucide:ban',
    info: 'lucide:info',
    neutral: 'lucide:circle',
}

export const STATUS_TEXT_COLOR: Record<StatusVariant, string> = {
    success: 'text-success', warning: 'text-warning', danger: 'text-destructive', error: 'text-destructive',
    processing: 'text-info', pending: 'text-warning', disabled: 'text-muted-foreground', info: 'text-info', neutral: 'text-muted-foreground',
    purple: 'text-chart-4', amber: 'text-warning', blue: 'text-chart-1', cyan: 'text-chart-2', green: 'text-success',
    grey: 'text-muted-foreground', indigo: 'text-chart-1', 'light-blue': 'text-info', 'light-green': 'text-emerald-500 dark:text-emerald-300',
    lime: 'text-chart-3', orange: 'text-warning', pink: 'text-chart-5', red: 'text-destructive', teal: 'text-chart-2', violet: 'text-chart-4', yellow: 'text-warning',
}

export const STATUS_DOT_COLOR: Record<StatusVariant, string> = {
    success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive', error: 'bg-destructive',
    processing: 'bg-info', pending: 'bg-warning', disabled: 'bg-neutral', info: 'bg-info', neutral: 'bg-neutral',
    purple: 'bg-chart-4', amber: 'bg-warning', blue: 'bg-chart-1', cyan: 'bg-chart-2', green: 'bg-success',
    grey: 'bg-neutral', indigo: 'bg-chart-1', 'light-blue': 'bg-info', 'light-green': 'bg-emerald-400',
    lime: 'bg-chart-3', orange: 'bg-warning', pink: 'bg-chart-5', red: 'bg-destructive', teal: 'bg-chart-2', violet: 'bg-chart-4', yellow: 'bg-warning',
}
