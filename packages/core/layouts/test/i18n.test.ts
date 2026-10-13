import { describe, expect, it } from 'vitest'
import { createLayoutsI18n } from '../src/i18n'

describe('layout navigation translations', () => {
    it('provides the nested sidebar back label in both framework locales', () => {
        const i18n = createLayoutsI18n({ locale: 'zh-CN' })
        expect(i18n.global.t('navigation.back')).toBe('返回')

        i18n.global.locale.value = 'en-US'
        expect(i18n.global.t('navigation.back')).toBe('Back')
    })
})
