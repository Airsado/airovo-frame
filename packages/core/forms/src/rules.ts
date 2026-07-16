/**
 * parseRules — 把 schema 的 `rules` 字段（zod schema 或字符串 DSL）
 * 统一转换为可用的 zod schema。给 VeeField 的 `:rules` 用。
 *
 * 支持的字符串 token（多个用 `,` 分隔，按序叠加）：
 *   - `required`     非空（min:1）
 *   - `email`        邮箱
 *   - `phone`        中国大陆手机号（1[3-9]xxxxxxxxx）
 *   - `min:N`        至少 N 个字符
 *   - `max:N`        最多 N 个字符
 *
 * 直接传入 ZodTypeAny 时原样返回。
 *
 * @example
 *   parseRules('required')              → z.string().min(1, '必填')
 *   parseRules('phone')                → z.string().regex(/^1[3-9]\d{9}$/)
 *   parseRules('required,email')       → chain
 *   parseRules('required,min:6,max:20') → chain
 *   parseRules(someZodSchema)          → someZodSchema
 */
import { z, type ZodTypeAny } from 'zod'

export function parseRules(
    rules: ZodTypeAny | string | undefined,
): ZodTypeAny {
    if (rules === undefined) return z.string().optional()
    if (typeof rules !== 'string') return rules

    let schema: ZodTypeAny = z.string()
    for (const raw of rules.split(',')) {
        const token = raw.trim()
        if (!token) continue

        if (token === 'required') {
            schema = (schema as any).min(1, '必填')
        } else if (token === 'email') {
            schema = (schema as any).email('邮箱格式错误')
        } else if (token === 'phone') {
            schema = (schema as any).regex(
                /^1[3-9]\d{9}$/,
                '手机号格式错误',
            )
        } else if (token.startsWith('min:')) {
            const n = Number.parseInt(token.slice(4), 10)
            if (Number.isFinite(n) && n >= 0) {
                schema = (schema as any).min(n, `至少 ${n} 个字符`)
            }
        } else if (token.startsWith('max:')) {
            const n = Number.parseInt(token.slice(4), 10)
            if (Number.isFinite(n) && n >= 0) {
                schema = (schema as any).max(n, `最多 ${n} 个字符`)
            }
        }
        // 未知 token 静默忽略
    }
    return schema
}
