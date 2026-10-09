// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { useForm, type FormApi, type FormFieldSchema } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount() })

describe.each(['root', 'nested', 'inherited'] as const)('%s disabled array actions', (scope) => {
    it.each(['field', 'dependency', 'form', 'loading'] as const)('blocks mutations via %s and allows them when enabled', async (mode) => {
        const disabled = ref(true)
        let api!: FormApi
        const arrayField: FormFieldSchema = {
            fieldName: 'items', label: 'Items', component: 'Input', array: true, maxItems: 3,
            disabled: mode === 'field' && scope !== 'inherited' ? () => disabled.value : undefined,
            dependencies: mode === 'dependency' && scope !== 'inherited' ? { triggerFields: [], disabled: () => disabled.value } : undefined,
        }
        const parent: FormFieldSchema = {
            fieldName: 'group', label: 'Group', component: 'Input', children: [arrayField],
            disabled: mode === 'field' && scope === 'inherited' ? () => disabled.value : undefined,
            dependencies: mode === 'dependency' && scope === 'inherited' ? { triggerFields: [], disabled: () => disabled.value } : undefined,
        }
        const Host = defineComponent({ setup() {
            const [Form, formApi] = useForm({
                schema: [scope === 'root' ? arrayField : parent, { fieldName: 'other', label: 'Other', component: 'Input' }],
                initialValues: scope === 'root' ? { items: [{ value: 'one' }, { value: 'two' }] } : { group: [{ items: [{ value: 'one' }, { value: 'two' }] }] },
                disabled: mode === 'form', loading: mode === 'loading',
            })
            api = formApi
            return () => h(Form)
        } })
        wrapper = mount(Host, { attachTo: document.body })
        await flushPromises()
        const before = await api.getValues()
        const actions = () => wrapper!.findAll<HTMLButtonElement>('button').filter(b => b.text().includes('+ 添加') || b.text() === '删除')
        expect(actions()).toHaveLength(3)
        for (const button of actions()) {
            expect(button.element.disabled || button.element.matches(':disabled')).toBe(true)
            button.element.click()
            // Native disabled and the mutation handler should both guard the path.
            button.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
        await flushPromises()
        expect(await api.getValues()).toEqual(before)
        if (mode === 'field' || mode === 'dependency') expect(wrapper.get<HTMLInputElement>('input[name="other[0].value"]').element.disabled).toBe(false)
        disabled.value = false
        api.setProps({ disabled: false, loading: false })
        await flushPromises()
        const add = actions().find(b => b.text().includes('+ 添加'))!
        expect(add.element.disabled).toBe(false)
        add.element.click()
        await flushPromises()
        expect(wrapper.findAll('input')).toHaveLength(4)
        expect(add.element.disabled).toBe(true)
        add.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await flushPromises()
        expect(wrapper.findAll('input')).toHaveLength(4)
        actions().find(b => b.text() === '删除')!.element.click()
        await flushPromises()
        const values = await api.getValues()
        const rows = scope === 'root' ? values.items : (values.group as Array<{ items: unknown[] }>)[0].items
        expect(rows).toEqual([{ value: 'two' }, { value: '' }])
    })
})
