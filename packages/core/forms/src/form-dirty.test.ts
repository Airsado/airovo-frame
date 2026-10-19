// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { useForm, type FormApi } from './index'

describe('FormApi clean baselines', () => {
  it('tracks edits independently and accepts loaded/saved values without losing false or zero', async () => {
    const apis: FormApi[] = []
    const FieldForm = defineComponent({
      setup() {
        const [Form, api] = useForm({
          schema: [{ fieldName: 'title', label: 'Title', component: 'Input' }],
          initialValues: { title: [{ value: 'initial' }] },
        })
        apis.push(api)
        return () => h(Form)
      },
    })
    const wrapper = mount(defineComponent({ setup: () => () => h('div', [h(FieldForm), h(FieldForm)]) }))
    await flushPromises()
    const first = apis[0]!
    const second = apis[1]!
    expect(first.isDirty).toBe(false)
    first.resetForm({ title: [{ value: 'loaded' }], count: 0, enabled: false })
    await flushPromises()
    expect(first.isDirty).toBe(false)
    await wrapper.findAll('input')[0]!.setValue('edited')
    expect(first.isDirty).toBe(true)
    expect(second.isDirty).toBe(false)
    first.markPristine()
    await flushPromises()
    expect(first.isDirty).toBe(false)
    expect(await first.getRawValues()).toMatchObject({ title: [{ value: 'edited' }], count: 0, enabled: false })
    first.setFieldValue('title[0].value', 'another edit')
    expect(first.isDirty).toBe(true)
    first.resetForm()
    await flushPromises()
    expect(await first.getValues()).toMatchObject({ title: [{ value: 'initial' }] })
    expect(first.isDirty).toBe(false)
    wrapper.unmount()
    expect(first.isDirty).toBe(false)
  })
})
