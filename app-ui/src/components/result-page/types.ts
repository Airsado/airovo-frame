export type ResultStatus = 'success' | 'error' | 'warning' | 'info' | '403' | '404' | '500'

export const RESULT_PRESET: Record<ResultStatus, { title: string; description: string; icon: string; secondaryText?: string }> = {
    success: { title: '操作成功', description: '请等待后续通知', icon: 'lucide:circle-check-big' },
    error: { title: '操作失败', description: '请稍后重试或联系管理员', icon: 'lucide:circle-x' },
    warning: { title: '请注意', description: '存在需要处理的风险', icon: 'lucide:triangle-alert' },
    info: { title: '提示', description: '', icon: 'lucide:info' },
    '403': { title: '无访问权限', description: '请联系管理员申请权限', icon: 'lucide:lock-keyhole', secondaryText: '返回首页' },
    '404': { title: '页面不存在', description: '请检查链接是否正确', icon: 'lucide:file-question', secondaryText: '返回首页' },
    '500': { title: '服务异常', description: '请稍后重试', icon: 'lucide:server-off', secondaryText: '返回首页' },
}
