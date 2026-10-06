// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useFormContext } from 'vee-validate'
import { AForm, useForm, type FormApi } from './index'

let wrapper: VueWrapper | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

async function mountForms(directRenderer = false) {
    let firstApi!: FormApi
    let secondApi!: FormApi
    const firstSubmit = vi.fn()
    const secondSubmit = vi.fn()
    const showFirst = ref(true)
    const ContextProbe = defineComponent({
        setup() {
            const form = useFormContext()
            return () => h('output', { 'data-context': '' }, JSON.stringify(form.values))
        },
    })
    const Host = defineComponent({
        setup() {
            const [FirstForm, first] = useForm({
                schema: [
                    { fieldName: 'name', label: 'Name', component: 'Input', rules: 'required' },
                    { fieldName: 'address', label: 'Address', component: 'Input' },
                    { fieldName: 'sort', label: 'Sort', component: 'Input' },
                    { fieldName: 'tags', label: 'Tags', component: 'Input', array: true },
                ],
                initialValues: {
                    name: [{ value: 'Ada' }], address: [{ value: 'First street' }],
                    sort: [{ value: '1' }], tags: [{ value: 'first-tag' }],
                },
                handleSubmit: firstSubmit,
            })
            const [SecondForm, second] = useForm({
                schema: [
                    { fieldName: 'category', label: 'Category', component: 'Input', rules: 'required' },
                    { fieldName: 'sort', label: 'Sort', component: 'Input' },
                    { fieldName: 'tags', label: 'Tags', component: 'Input', array: true },
                ],
                initialValues: {
                    category: [{ value: 'Second' }], sort: [{ value: '2' }],
                    tags: [{ value: 'second-tag' }],
                },
                handleSubmit: secondSubmit,
            })
            firstApi = first
            secondApi = second
            return () => h('main', [
                showFirst.value ? h(directRenderer ? AForm : FirstForm, {
                    api: first, 'data-form': 'first',
                }, { actions: () => h(ContextProbe) }) : undefined,
                h(directRenderer ? AForm : SecondForm, {
                    api: second, 'data-form': 'second',
                }, { actions: () => h(ContextProbe) }),
            ])
        },
    })
    wrapper = mount(Host)
    await flushPromises()
    return { wrapper, firstApi, secondApi, firstSubmit, secondSubmit, showFirst }
}

describe('form instance isolation', () => {
    it.each([false, true])('binds unique and shared fields to their own controller (direct AForm: %s)', async (direct) => {
        const { wrapper, firstApi, secondApi } = await mountForms(direct)
        const first = wrapper.find('[data-form="first"]')
        const second = wrapper.find('[data-form="second"]')
        expect(first.find('input[name="name[0].value"]').exists()).toBe(true)
        expect(first.find('input[name="address[0].value"]').exists()).toBe(true)
        expect(second.find('input[name="category[0].value"]').exists()).toBe(true)
        expect(first.find<HTMLInputElement>('input[name="sort[0].value"]').element.value).toBe('1')
        expect(second.find<HTMLInputElement>('input[name="sort[0].value"]').element.value).toBe('2')
        expect(JSON.parse(first.find('[data-context]').text())).toEqual(await firstApi.getValues())
        expect(JSON.parse(second.find('[data-context]').text())).toEqual(await secondApi.getValues())

        await first.find('input[name="sort[0].value"]').setValue('11')
        await second.find('input[name="sort[0].value"]').setValue('22')
        expect((await firstApi.getValues()).sort).toEqual([{ value: '11' }])
        expect((await secondApi.getValues()).sort).toEqual([{ value: '22' }])
    })

    it('isolates errors, submissions, and reset even when field names overlap', async () => {
        const { wrapper, firstApi, secondApi, firstSubmit, secondSubmit } = await mountForms()
        const first = wrapper.find('[data-form="first"]')
        const second = wrapper.find('[data-form="second"]')
        await first.find('input[name="name[0].value"]').setValue('')
        await first.find('input[name="sort[0].value"]').setValue('11')
        await first.trigger('submit')
        await vi.waitFor(() => expect(firstApi.loading).toBe(false))
        expect(firstApi.errors.value['name[0].value']).toBe('必填')
        expect(first.find('[data-slot="field-error"]').text()).toContain('必填')
        expect(secondApi.errors.value).toEqual({})
        expect(second.find('[data-slot="field-error"]').exists()).toBe(false)
        expect(firstSubmit).not.toHaveBeenCalled()

        await second.find('input[name="sort[0].value"]').setValue('22')
        await second.trigger('submit')
        await vi.waitFor(() => expect(secondSubmit).toHaveBeenCalledOnce())
        expect(secondSubmit).toHaveBeenCalledWith(expect.objectContaining({ sort: [{ value: '22' }] }))
        expect(firstApi.errors.value['name[0].value']).toBe('必填')
        firstApi.resetForm()
        await flushPromises()
        expect(first.find<HTMLInputElement>('input[name="name[0].value"]').element.value).toBe('Ada')
        expect(first.find<HTMLInputElement>('input[name="sort[0].value"]').element.value).toBe('1')
        expect(firstApi.errors.value).toEqual({})
        expect((await secondApi.getValues()).sort).toEqual([{ value: '22' }])

        await first.trigger('submit')
        await vi.waitFor(() => expect(firstSubmit).toHaveBeenCalledOnce())
        expect(firstSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: [{ value: 'Ada' }] }))
    })

    it('pushes and removes shared field-array rows without mutating another form', async () => {
        const { wrapper, firstApi, secondApi } = await mountForms()
        const first = wrapper.find('[data-form="first"]')
        const second = wrapper.find('[data-form="second"]')
        const addFirst = first.findAll('button').find((button) => button.text().includes('+ 添加'))!
        await addFirst.trigger('click')
        await first.find('input[name="tags[1].value"]').setValue('first-extra')
        expect((await firstApi.getValues()).tags).toEqual([{ value: 'first-tag' }, { value: 'first-extra' }])
        expect((await secondApi.getValues()).tags).toEqual([{ value: 'second-tag' }])
        expect(second.find('input[name="tags[1].value"]').exists()).toBe(false)

        const removeFirst = first.findAll('button').find((button) => button.text() === '删除')!
        await removeFirst.trigger('click')
        expect((await firstApi.getValues()).tags).toEqual([{ value: 'first-extra' }])
        expect((await secondApi.getValues()).tags).toEqual([{ value: 'second-tag' }])
        expect(first.find<HTMLInputElement>('input[name="tags[0].value"]').element.value).toBe('first-extra')
    })

    it('retains its page-owned context across renderer unmounts and async pre-open fills', async () => {
        const { wrapper, firstApi, secondApi, showFirst } = await mountForms()
        const originalContext = firstApi.form
        await wrapper.find('[data-form="first"] input[name="sort[0].value"]').setValue('11')
        showFirst.value = false
        await nextTick()
        expect(firstApi.form).toBe(originalContext)
        expect((await firstApi.getValues()).sort).toEqual([{ value: '11' }])

        const row = await Promise.resolve({ name: [{ value: 'Grace' }], address: [{ value: 'Loaded street' }] })
        await firstApi.setValues(row)
        showFirst.value = true
        await flushPromises()
        const first = wrapper.find('[data-form="first"]')
        expect(first.find<HTMLInputElement>('input[name="name[0].value"]').element.value).toBe('Grace')
        expect(first.find<HTMLInputElement>('input[name="address[0].value"]').element.value).toBe('Loaded street')
        expect(first.find<HTMLInputElement>('input[name="sort[0].value"]').element.value).toBe('11')
        expect((await secondApi.getValues()).sort).toEqual([{ value: '2' }])
        wrapper.unmount()
        expect(firstApi.form).toBeNull()
        expect(secondApi.form).toBeNull()
    })
})
