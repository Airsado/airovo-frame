// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useForm, type FormApi, type FormFieldSchema } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

describe('conditional form sections', () => {
    it.each([false, true])('moves headings to visible fields and hides empty groups (nested: %s)', async (nested) => {
        let api!: FormApi
        const enabled = (values: Record<string, unknown>) => (
            (values.mode as Array<{ value: string }>)?.[0]?.value === 'video'
        )
        const fields: FormFieldSchema[] = [
            { fieldName: 'hiddenFirst', label: 'Hidden first', component: 'Input', section: 'Shared', show: false },
            { fieldName: 'visibleSecond', label: 'Visible second', component: 'Input', section: 'Shared' },
            {
                fieldName: 'videoFilter', label: 'Video filter', component: 'Input', section: 'Video only',
                show: ({ values }) => enabled(values),
            },
            {
                fieldName: 'videoLine', label: 'Video line', component: 'Input', section: 'Video only',
                dependencies: { triggerFields: ['$root.mode'], if: ({ values }) => enabled(values) },
            },
            { fieldName: 'auth', label: 'Auth', component: 'Input', section: 'Auth settings' },
        ]
        const Host = defineComponent({ setup() {
            const [Form, formApi] = useForm({
                showDefaultActions: false,
                schema: [
                    { fieldName: 'mode', label: 'Mode', component: 'Input' },
                    ...(nested
                        ? [{ fieldName: 'settings', label: 'Settings', component: 'Input' as const, children: fields }]
                        : fields),
                ],
                initialValues: { mode: [{ value: 'article' }] },
            })
            api = formApi
            return () => h(Form)
        } })
        wrapper = mount(Host)
        await flushPromises()
        const headings = () => wrapper!.findAll('p.font-semibold').map((heading) => heading.text())
        expect(headings()).toEqual(['Shared', 'Auth settings'])

        await api.setValues({ mode: [{ value: 'video' }] })
        await flushPromises()
        expect(headings()).toEqual(['Shared', 'Video only', 'Auth settings'])
        const filterName = nested ? 'settings[0].videoFilter' : 'videoFilter[0].value'
        await wrapper.get(`input[name="${filterName}"]`).setValue('2026')

        await api.setValues({ mode: [{ value: 'article' }] })
        await flushPromises()
        expect(headings()).toEqual(['Shared', 'Auth settings'])
        expect(wrapper.find(`input[name="${filterName}"]`).exists()).toBe(false)

        await api.setValues({ mode: [{ value: 'video' }] })
        await flushPromises()
        expect(headings()).toEqual(['Shared', 'Video only', 'Auth settings'])
        expect(wrapper.get<HTMLInputElement>(`input[name="${filterName}"]`).element.value).toBe('2026')
    })
})
