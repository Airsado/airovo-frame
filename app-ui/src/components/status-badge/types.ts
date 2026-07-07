export type StatusPreset =
    | 'success' | 'error' | 'warning'
    | 'processing' | 'pending' | 'disabled'
    | 'info' | 'neutral'

export const STATUS_PRESET_LABEL: Record<StatusPreset, string> = {
    success: '成功',
    error: '失败',
    warning: '警告',
    processing: '进行中',
    pending: '等待中',
    disabled: '已停用',
    info: '提示',
    neutral: '草稿',
}

export const STATUS_PRESET_ICON: Record<StatusPreset, string> = {
    success: 'lucide:check-circle-2',
    error: 'lucide:x-circle',
    warning: 'lucide:alert-triangle',
    processing: 'lucide:loader-circle',
    pending: 'lucide:clock',
    disabled: 'lucide:ban',
    info: 'lucide:info',
    neutral: 'lucide:circle',
}
