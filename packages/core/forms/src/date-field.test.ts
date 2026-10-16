// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { useForm, type FormApi, type FormFieldSchema } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

const DatePickerStub = defineComponent({
    name: 'DatePicker',
    props: {
        modelValue: { type: [Date, String, Object], default: undefined },
        disabled: Boolean,
        id: String,
        name: String,
        ariaInvalid: { type: [Boolean, String], default: undefined },
        placeholder: String,
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('button', {
            type: 'button',
            'data-date-picker': 'date',
            'data-disabled': String(props.disabled),
            id: props.id,
            name: props.name,
            'aria-invalid': props.ariaInvalid,
            'aria-label': props.placeholder,
            onClick: () => emit('update:modelValue', new Date(2025, 0, 2)),
        })
    },
})

const DateTimePickerStub = defineComponent({
    name: 'DateTimePicker',
    props: {
        modelValue: { type: [Date, String, Object], default: undefined },
        disabled: Boolean,
        id: String,
        name: String,
        ariaInvalid: { type: [Boolean, String], default: undefined },
        placeholder: String,
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('button', {
            type: 'button',
            'data-date-picker': 'datetime',
            'data-disabled': String(props.disabled),
            id: props.id,
            name: props.name,
            'aria-invalid': props.ariaInvalid,
            'aria-label': props.placeholder,
            onClick: () => emit('update:modelValue', new Date(2025, 0, 2, 9, 30)),
        })
    },
})

function mountForm(schema: FormFieldSchema[]): FormApi {
    let api!: FormApi
    const Host = defineComponent({
        setup() {
            const [Form, formApi] = useForm({ schema, showDefaultActions: false })
            api = formApi
            return () => h(Form)
        },
    })
    wrapper = mount(Host, {
        global: { stubs: { DatePicker: DatePickerStub, DateTimePicker: DateTimePickerStub } },
    })
    return api
}

describe('DatePicker form field mapping', () => {
    it.each([
        ['DatePicker', 'date'],
        ['date', 'date'],
        ['DateTimePicker', 'datetime'],
        ['datetime', 'datetime'],
    ] as const)('maps %s to the matching DatePickerField mode', async (component, mode) => {
        mountForm([{
            fieldName: 'scheduledAt',
            label: 'Scheduled at',
            component,
            defaultValue: new Date(2025, 0, 1),
            componentProps: { id: 'scheduled-at', name: 'scheduledAt' },
        }])
        await flushPromises()

        const control = wrapper!.get('[data-date-picker]')
        expect(control.attributes('data-date-picker')).toBe(mode)
        expect(control.attributes('id')).toBe('scheduled-at')
        expect(control.attributes('name')).toBe('scheduledAt')
        expect(control.attributes('aria-label')).toBe('请选择Scheduled at')
    })

    it('shares disabled and value updates with nested date fields', async () => {
        const api = mountForm([{
            fieldName: 'settings',
            label: 'Settings',
            component: 'Input',
            children: [{
                fieldName: 'expiresAt',
                label: 'Expires at',
                component: 'datetime',
                defaultValue: new Date(2025, 0, 1),
            }],
        }])
        await flushPromises()

        const control = wrapper!.get('[data-date-picker="datetime"]')
        expect(control.attributes('data-disabled')).toBe('false')
        await control.trigger('click')
        expect((api.values.value.settings as Array<{ expiresAt?: unknown }>)?.[0]?.expiresAt).toBeInstanceOf(Date)

        api.setProps({ disabled: true })
        await flushPromises()
        expect(control.attributes('data-disabled')).toBe('true')
    })
})
