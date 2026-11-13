// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import Register from '../src/Register.vue'
import enUS from '../../layouts/src/locales/en-US.json'
import zhCN from '../../layouts/src/locales/zh-CN.json'

let wrapper: VueWrapper | undefined
afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

function render(props: Record<string, unknown> = {}, locale = 'en-US') {
    const i18n = createI18n({ legacy: false, locale, messages: { 'en-US': enUS, 'zh-CN': zhCN } })
    // Existing apps can still override the old six-character message. Custom
    // policy text must use a parameterized key instead of inheriting that copy.
    i18n.global.mergeLocaleMessage('en-US', { auth: { register: { passwordLength: 'At least 6 characters' } } })
    wrapper = mount(Register, { props, global: { plugins: [i18n] } })
    return wrapper
}

async function fill(field: string, value: string) {
    await wrapper!.get(`input[name="${field}[0].value"]`).setValue(value)
}

async function baseValues(password = 'secret12') {
    await fill('username', 'example')
    await fill('email', 'example@example.com')
    await fill('password', password)
    await fill('confirmPassword', password)
}

async function submit() {
    await wrapper!.get('form').trigger('submit')
    await flushPromises()
    // vee-validate schedules its schema validation after collecting field edits.
    await new Promise((resolve) => setTimeout(resolve, 30))
    await flushPromises()
}

describe('Register optional fields', () => {
    it('keeps the default four-field submission compatible', async () => {
        render()
        await flushPromises()
        expect(wrapper!.findAll('input')).toHaveLength(4)
        await baseValues()
        await submit()
        expect(wrapper!.emitted('submit')).toEqual([[{
            username: 'example', email: 'example@example.com',
            password: 'secret12', confirmPassword: 'secret12',
        }]])
    })

    it('requires enabled security fields and includes only enabled values', async () => {
        render({ display: { showSecurityFields: true } })
        await flushPromises()
        await baseValues()
        await submit()
        expect(wrapper!.emitted('submit')).toBeUndefined()
        expect(wrapper!.text()).toContain('Enter a security question')
        expect(wrapper!.text()).toContain('Enter a security answer')

        await fill('securityQuestion', 'First school?')
        await fill('securityAnswer', 'Example School')
        await submit()
        expect(wrapper!.emitted('submit')?.[0]?.[0]).toMatchObject({
            securityQuestion: 'First school?', securityAnswer: 'Example School',
        })
        expect(wrapper!.emitted('submit')?.[0]?.[0]).not.toHaveProperty('verificationToken')
    })

    it('accepts an empty optional verification token and passes an entered token through', async () => {
        render({ display: { showVerificationToken: true } })
        await flushPromises()
        await baseValues()
        await submit()
        expect(wrapper!.emitted('submit')?.[0]?.[0]).toMatchObject({ verificationToken: undefined })
        await fill('verificationToken', 'generic-token')
        await submit()
        expect(wrapper!.emitted('submit')?.[1]?.[0]).toMatchObject({ verificationToken: 'generic-token' })
    })

    it.each(['en-US', 'zh-CN'])('keeps custom password policy copy and validation aligned in %s', async (locale) => {
        render({ passwordMinLength: 10 }, locale)
        await flushPromises()
        const expected = locale === 'en-US' ? 'Password must contain at least 10 characters' : '密码至少需要 10 位字符'
        expect(wrapper!.text()).toContain(expected)
        expect(wrapper!.get('input[name="password[0].value"]').attributes('placeholder')).toContain('10')
        await baseValues('secret12')
        await submit()
        expect(wrapper!.emitted('submit')).toBeUndefined()
        expect(wrapper!.text()).toContain(expected)
        await fill('password', 'secret1234')
        await fill('confirmPassword', 'secret1234')
        await submit()
        expect(wrapper!.emitted('submit')).toHaveLength(1)
    })
})
