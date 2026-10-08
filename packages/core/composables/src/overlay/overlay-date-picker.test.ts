// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, markRaw, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DatePicker from '../../../components/src/date-picker/DatePicker.vue'
import DateTimePicker from '../../../components/src/date-picker/DateTimePicker.vue'
import { useForm, type FormApi } from '../../../forms/src'
import { useDrawer } from '../drawer/use-drawer'
import { useModal } from '../modal/use-modal'
import { overlayStack } from './overlay-stack'

const wrappers: VueWrapper[] = []
const initialDate = () => new Date(2026, 9, 8, 9, 30)

async function settle() {
    await nextTick()
    await flushPromises()
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
}

afterEach(async () => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount()
    await settle()
    overlayStack.clear()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.pointerEvents = ''
})

function attach(component: ReturnType<typeof defineComponent>) {
    const wrapper = mount(component, { attachTo: document.body })
    wrappers.push(wrapper)
    return wrapper
}

async function openCalendar() {
    const trigger = document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!
    expect(trigger).toBeTruthy()
    trigger.focus()
    trigger.click()
    await settle()
    const popup = document.querySelector<HTMLElement>('[data-slot="popover-content"]')!
    expect(popup).toBeTruthy()
    return { trigger, popup }
}

function selectDay(popup: HTMLElement) {
    const day = [...popup.querySelectorAll<HTMLButtonElement>('[data-slot="calendar-cell-trigger"]')]
        .find((cell) => cell.textContent?.trim() === '12' && !cell.hasAttribute('data-outside-view'))!
    expect(day).toBeTruthy()
    day.click()
}

function escape() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
}

describe('Date popups in framework overlay hosts', () => {
    it('preserves standalone DatePicker selection, primitive layer and trigger focus', async () => {
        const value = ref<Date | undefined>(initialDate())
        attach(defineComponent({ setup: () => () => h(DatePicker, {
            modelValue: value.value, 'onUpdate:modelValue': (date) => { value.value = date },
        }) }))
        const { popup, trigger } = await openCalendar()
        expect(popup.style.zIndex).toBe('')
        expect(overlayStack.size).toBe(0)
        selectDay(popup)
        await settle()
        expect(value.value).toBeInstanceOf(Date)
        expect(value.value?.getDate()).toBe(12)
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)
    })

    for (const component of [DatePicker, DateTimePicker]) {
        for (const kind of ['modal', 'drawer', 'nested'] as const) {
            it(`selects a Date with ${component === DatePicker ? 'DatePicker' : 'DateTimePicker'} in ${kind}`, async () => {
                let api!: ReturnType<typeof useModal>[1] | ReturnType<typeof useDrawer>[1]
                let drawerApi: ReturnType<typeof useDrawer>[1] | undefined
                const value = ref<Date | undefined>(initialDate())
                attach(defineComponent({
                    setup() {
                        const [Host, host] = kind === 'drawer'
                            ? useDrawer({ title: 'Date drawer', description: 'Date ownership' })
                            : useModal({ title: 'Date modal', description: 'Date ownership' })
                        api = host
                        const content = () => h(Host, {}, { default: () => h(component, {
                            modelValue: value.value, 'onUpdate:modelValue': (date) => { value.value = date },
                        }) })
                        if (kind !== 'nested') return content
                        const [Drawer, drawer] = useDrawer({ title: 'Parent drawer', description: 'Nested date' })
                        drawerApi = drawer
                        return () => h(Drawer, {}, { default: content })
                    },
                }))
                drawerApi?.open()
                await settle()
                api.open()
                await settle()
                const { popup, trigger } = await openCalendar()
                const hosts = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
                    .filter((element) => element !== popup)
                const hostLayer = Math.max(...hosts.map((host) => Number(host.style.zIndex)))
                expect(hosts.some((host) => host.contains(popup))).toBe(false)
                expect(Number(popup.style.zIndex)).toBe(hostLayer + 1)
                selectDay(popup)
                await settle()
                expect(value.value).toBeInstanceOf(Date)
                expect(value.value?.getDate()).toBe(12)
                expect(api.state.open).toBe(true)
                expect(trigger.getAttribute('aria-expanded')).toBe('false')
                if (component === DateTimePicker) {
                    const time = document.querySelector<HTMLInputElement>('input[type="time"]')!
                    expect(time.disabled).toBe(false)
                    expect(time.value).toBe('09:30')
                    time.value = '16:45'
                    time.dispatchEvent(new Event('input', { bubbles: true }))
                    await settle()
                    expect(value.value?.getHours()).toBe(16)
                    expect(value.value?.getMinutes()).toBe(45)
                    document.querySelector<HTMLButtonElement>('[aria-label="清除日期时间"]')!.click()
                    await settle()
                    expect(value.value).toBeUndefined()
                    expect(time.disabled).toBe(true)
                }
            })
        }
    }

    it('inherits ownership through an external AForm and closes calendar, Modal, Drawer separately', async () => {
        let modalApi!: ReturnType<typeof useModal>[1]
        let drawerApi!: ReturnType<typeof useDrawer>[1]
        let formApi!: FormApi
        const ChildForm = defineComponent({
            setup() {
                const [Form, api] = useForm({
                    showDefaultActions: false,
                    schema: [{ fieldName: 'date', label: 'Date', component: markRaw(DatePicker) }],
                    initialValues: { date: [{ value: initialDate() }] },
                })
                formApi = api
                return () => h(Form)
            },
        })
        attach(defineComponent({
            setup() {
                const [Drawer, drawer] = useDrawer({ title: 'Parent drawer', description: 'Drawer' })
                const [Modal, modal] = useModal({ title: 'Form modal', description: 'External form' })
                drawerApi = drawer
                modalApi = modal
                return () => h(Drawer, {}, { default: () => h(Modal, {}, { default: () => h(ChildForm) }) })
            },
        }))
        drawerApi.open()
        await settle()
        modalApi.open()
        await settle()
        const { popup } = await openCalendar()
        selectDay(popup)
        await vi.waitFor(() => expect((formApi.values.value.date as { value: Date }[])[0].value.getDate()).toBe(12))
        await openCalendar()
        escape()
        await settle()
        expect(document.querySelector('[data-slot="popover-content"]')).toBeNull()
        expect(modalApi.state.open).toBe(true)
        expect(drawerApi.state.open).toBe(true)
        escape()
        await settle()
        expect(modalApi.state.open).toBe(false)
        expect(drawerApi.state.open).toBe(true)
        escape()
        await settle()
        expect(drawerApi.state.open).toBe(false)
        expect(overlayStack.size).toBe(0)
        expect(document.body.style.overflow).toBe('')
        expect(document.body.style.pointerEvents).toBe('')
    })

    it('closes a covered calendar below the new backdrop without taking its focus', async () => {
        let parentApi!: ReturnType<typeof useModal>[1]
        let childApi!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Parent, parent] = useModal({ title: 'Parent', description: 'Parent date' })
                const [Child, child] = useModal({ title: 'Child', description: 'New main layer' })
                parentApi = parent
                childApi = child
                return () => h('div', [
                    h(Parent, {}, { default: () => h(DatePicker, { modelValue: initialDate() }) }),
                    h(Child, {}, { default: () => h('button', { 'data-child-focus': '' }, 'Child action') }),
                ])
            },
        }))
        parentApi.open()
        await settle()
        const { trigger, popup } = await openCalendar()
        const originalLayer = Number(popup.style.zIndex)
        childApi.open()
        await settle()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.querySelector('[data-slot="popover-content"]')).toBeNull()
        expect(document.activeElement).not.toBe(trigger)
        const childLayer = Math.max(...[...document.querySelectorAll<HTMLElement>('[role="dialog"]')].map((host) => Number(host.style.zIndex)))
        expect(originalLayer).toBeLessThan(childLayer - 1)
        // Hidden lower hosts cannot reopen their calendar beneath the new layer.
        trigger.click()
        await settle()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(parentApi.state.open).toBe(true)
        expect(childApi.state.open).toBe(true)
    })

    it('closes on owner API dismissal and gives each reopened host its fresh layer', async () => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Modal, modal] = useModal({ title: 'Reopen', description: 'Owner lifecycle' })
                api = modal
                return () => h(Modal, {}, { default: () => h(DatePicker) })
            },
        }))
        let previousLayer = 0
        for (let iteration = 0; iteration < 3; iteration++) {
            api.open()
            await settle()
            const { popup } = await openCalendar()
            const layer = Number(popup.style.zIndex)
            expect(layer).toBeGreaterThan(previousLayer)
            previousLayer = layer
            await api.close()
            await settle()
            expect(document.querySelector('[data-slot="popover-content"]')).toBeNull()
            expect(overlayStack.size).toBe(0)
            expect(document.body.style.overflow).toBe('')
            expect(document.body.style.pointerEvents).toBe('')
        }
    })

    it('dismisses a calendar inside a Modal without closing the owner', async () => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Modal, modal] = useModal({ title: 'Outside', description: 'Popup dismissal' })
                api = modal
                return () => h(Modal, {}, { default: () => [h(DatePicker), h('button', { 'data-outside': '' }, 'Other field')] })
            },
        }))
        api.open()
        await settle()
        const { trigger } = await openCalendar()
        document.querySelector('[data-outside]')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
        await settle()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(api.state.open).toBe(true)
    })
})
