// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataTableQueryForm from './DataTableQueryForm.vue'
import { normalizeQueryFormValues, unwrapQueryFormValue } from './data-table-query'

describe('data table query form', () => {
    afterEach(() => vi.restoreAllMocks())

    it('unwraps FormApi field rows and removes only empty query values', () => {
        expect(unwrapQueryFormValue({
            keyword: [{ value: 'Ada' }],
            status: [{ value: '' }],
            tags: [{ value: ['active', 'new'] }],
            count: [{ value: 0 }],
            enabled: [{ value: false }],
        })).toEqual({ keyword: 'Ada', status: '', tags: ['active', 'new'], count: 0, enabled: false })

        expect(normalizeQueryFormValues({
            keyword: [{ value: 'Ada' }],
            status: [{ value: '' }],
            count: [{ value: 0 }],
        }, [
            { fieldName: 'keyword', label: '关键字', component: 'Input' },
            { fieldName: 'status', label: '状态', component: 'Input' },
            { fieldName: 'count', label: '数量', component: 'Number' },
        ])).toEqual({ keyword: 'Ada', count: 0 })
    })

    it('applies submitted values to the table and emits the normalized query', async () => {
        const setFilters = vi.fn().mockResolvedValue(undefined)
        const wrapper = mount(DataTableQueryForm, {
            props: {
                schema: [{ fieldName: 'keyword', label: '关键字', component: 'Input' }],
                table: { setFilters },
            },
        })
        await wrapper.get('input[name="keyword[0].value"]').setValue('Ada')
        await wrapper.get('form').trigger('submit')
        await vi.waitFor(() => expect(setFilters).toHaveBeenCalled(), { timeout: 3000 })
        await flushPromises()

        expect(setFilters).toHaveBeenCalledWith({ keyword: 'Ada' })
        expect(wrapper.emitted('submit')).toEqual([[{ keyword: 'Ada' }]])
        expect(wrapper.emitted('update:filters')).toEqual([[{ keyword: 'Ada' }]])
    })

    it('resets the draft and applies empty filters', async () => {
        const setFilters = vi.fn().mockResolvedValue(undefined)
        const wrapper = mount(DataTableQueryForm, {
            props: {
                schema: [{ fieldName: 'keyword', label: '关键字', component: 'Input' }],
                initialValues: { keyword: [{ value: 'Ada' }] },
                table: { setFilters },
            },
        })

        const input = wrapper.get<HTMLInputElement>('input[name="keyword[0].value"]')
        expect(input.element.value).toBe('Ada')
        await input.setValue('Grace')
        const resetButton = wrapper.findAll('button').find((button) => button.text() === '重置')
        expect(resetButton).toBeDefined()
        await resetButton!.trigger('click')
        await vi.waitFor(() => expect(setFilters).toHaveBeenCalled(), { timeout: 3000 })
        await flushPromises()

        expect(input.element.value).toBe('Ada')
        expect(setFilters).toHaveBeenLastCalledWith({ keyword: 'Ada' })
        expect(wrapper.emitted('reset')).toEqual([[{ keyword: 'Ada' }]])
    })
})
